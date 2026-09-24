using Toeic.Api;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Toeic.Infrastructure.Persistence;
using Toeic.Infrastructure.Security;

﻿var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Postgres");
var runMigrations = builder.Configuration.GetValue<bool>("Database:RunMigrationsOnStartup");
var pseudonymKey = builder.Configuration["Analytics:PseudonymKeyBase64"];
var betaServingRequested = builder.Configuration.GetValue<bool>("Features:BetaServingEnabled");
var analyticsPseudonymConfigured = !string.IsNullOrWhiteSpace(pseudonymKey);
var persistenceConfigured = !string.IsNullOrWhiteSpace(connectionString);
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
builder.Services.AddHealthChecks();
var app = builder.Build();
app.UseToeicApiPipeline();
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
