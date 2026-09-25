using Toeic.Api;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Toeic.Infrastructure.Persistence;
using Toeic.Infrastructure.Security;
using Toeic.Application;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using System.Threading.RateLimiting;

﻿var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Postgres");
var runMigrations = builder.Configuration.GetValue<bool>("Database:RunMigrationsOnStartup");
var pseudonymKey = builder.Configuration["Analytics:PseudonymKeyBase64"];
var betaServingRequested = builder.Configuration.GetValue<bool>("Features:BetaServingEnabled");
var analyticsPseudonymConfigured = !string.IsNullOrWhiteSpace(pseudonymKey);
var persistenceConfigured = !string.IsNullOrWhiteSpace(connectionString);
var learnerApiEnabled = builder.Configuration.GetValue<bool>("Features:LearnerApiEnabled");
if (learnerApiEnabled && !persistenceConfigured)
    throw new InvalidOperationException("Learner API requires PostgreSQL.");
var betaServingEnabled = betaServingRequested && persistenceConfigured && analyticsPseudonymConfigured;
if (runMigrations && !persistenceConfigured)
    throw new InvalidOperationException(
        "ConnectionStrings:Postgres is required when startup migrations are enabled.");
if (betaServingRequested && !persistenceConfigured)
    throw new InvalidOperationException(
        "ConnectionStrings:Postgres is required when Beta serving is enabled.");
if (betaServingRequested && !analyticsPseudonymConfigured)
    throw new InvalidOperationException(
        "Analytics:PseudonymKeyBase64 is required when Beta serving is enabled.");
if (persistenceConfigured)
{
    builder.Services.AddToeicPostgres(connectionString!, Path.Combine(AppContext.BaseDirectory, "db"),
        runMigrations, betaServingEnabled);
}

if (analyticsPseudonymConfigured)
    builder.Services.AddToeicAnalyticsPseudonymizer(pseudonymKey!);
if (learnerApiEnabled)
{
    builder.Services.AddSingleton<ILearnerSessions, PostgresLearnerSessions>();
    var mail = builder.Configuration.GetSection("AccountMail").Get<AccountMailOptions>() ?? new();
    if (mail.Mode is not ("Disabled" or "Smtp" or "DevelopmentFile"))
        throw new InvalidOperationException("Unknown AccountMail mode.");
    if (mail.Mode != "Disabled")
    {
        if (!Uri.TryCreate(mail.PublicWebUrl, UriKind.Absolute, out var webUrl) ||
            (!builder.Environment.IsDevelopment() && webUrl.Scheme != "https") ||
            (webUrl.Scheme != "http" && webUrl.Scheme != "https") ||
            !string.IsNullOrEmpty(webUrl.UserInfo) || !string.IsNullOrEmpty(webUrl.Query) ||
            !string.IsNullOrEmpty(webUrl.Fragment))
            throw new InvalidOperationException("AccountMail:PublicWebUrl must be a trusted web origin.");
        if (mail.Mode == "DevelopmentFile" && (!builder.Environment.IsDevelopment() ||
            string.IsNullOrWhiteSpace(mail.DevelopmentDirectory)))
            throw new InvalidOperationException("DevelopmentFile mail requires Development and a directory.");
        if (mail.Mode == "Smtp" && (string.IsNullOrWhiteSpace(mail.SmtpHost) ||
            mail.SmtpPort is < 1 or > 65535 || !System.Net.Mail.MailAddress.TryCreate(mail.From, out _)))
            throw new InvalidOperationException("SMTP host, port and sender are required.");
        if (string.IsNullOrWhiteSpace(mail.TermsVersion))
            throw new InvalidOperationException("AccountMail:TermsVersion is required.");
        builder.Services.AddHostedService<AccountMailWorker>();
    }
    builder.Services.AddSingleton(mail);
    var dataProtection = builder.Services.AddDataProtection().SetApplicationName("Toeic.Accounts");
    var keyDirectory = builder.Configuration["AccountMail:DataProtectionKeyDirectory"];
    if (!string.IsNullOrWhiteSpace(keyDirectory))
        dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keyDirectory));
    builder.Services.AddSingleton<IAccountLifecycle, PostgresAccountLifecycle>();
    builder.Services.AddAuthentication(LearnerAuthentication.SchemeName)
        .AddScheme<AuthenticationSchemeOptions, LearnerAuthentication>(
            LearnerAuthentication.SchemeName, _ => { });
    builder.Services.AddAuthorization();
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.AddPolicy("login", context =>
            RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0
                }));
    });
}
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddHealthChecks();
var app = builder.Build();
app.UseCors();
app.UseToeicApiPipeline();
if (learnerApiEnabled)
{
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapSessionEndpoints();
    app.MapAccountEndpoints();
    app.MapLearnerEndpoints();
    app.MapProfileEndpoints();
    app.MapSupportEndpoints();
    app.MapFlashcardEndpoints();
    app.MapErrorNotebookEndpoints();
    if (betaServingEnabled) app.MapLessonQuizEndpoints();
}
app.MapHealthChecks("/health");
app.MapPlatformStatus(persistenceConfigured, analyticsPseudonymConfigured, betaServingEnabled);
if (persistenceConfigured)
    app.MapCurriculumEndpoints();
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHealthChecks("/health/ready");
app.Run();
