using Toeic.Api;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Toeic.Infrastructure.Persistence;
using Toeic.Infrastructure.Security;
using Toeic.Application;
using Microsoft.AspNetCore.Authentication;
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
builder.Services.AddHealthChecks();
var app = builder.Build();
app.UseToeicApiPipeline();
if (learnerApiEnabled)
{
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapSessionEndpoints();
    app.MapLearnerEndpoints();
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
