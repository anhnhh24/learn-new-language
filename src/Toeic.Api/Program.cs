using Toeic.Api;
using Toeic.Infrastructure.Persistence;
using Toeic.Infrastructure.Security;

﻿var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Postgres");
var runMigrations = builder.Configuration.GetValue<bool>("Database:RunMigrationsOnStartup");
var pseudonymKey = builder.Configuration["Analytics:PseudonymKeyBase64"];
var analyticsPseudonymConfigured = !string.IsNullOrWhiteSpace(pseudonymKey);
var persistenceConfigured = !string.IsNullOrWhiteSpace(connectionString);
if (runMigrations && !persistenceConfigured)
    throw new InvalidOperationException(
        "ConnectionStrings:Postgres is required when startup migrations are enabled.");
if (persistenceConfigured)
{
    builder.Services.AddToeicPostgres(connectionString!, Path.Combine(AppContext.BaseDirectory, "db"),
        runMigrations);
}

if (analyticsPseudonymConfigured)
    builder.Services.AddToeicAnalyticsPseudonymizer(pseudonymKey!);
builder.Services.AddHealthChecks();
var app = builder.Build();
app.UseToeicApiPipeline();
app.MapHealthChecks("/health");
app.MapPlatformStatus(persistenceConfigured, analyticsPseudonymConfigured);
app.Run();
