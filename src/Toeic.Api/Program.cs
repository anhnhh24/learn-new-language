using Toeic.Api;
using Toeic.Infrastructure.Persistence;

﻿var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Postgres");
var runMigrations = builder.Configuration.GetValue<bool>("Database:RunMigrationsOnStartup");
var persistenceConfigured = !string.IsNullOrWhiteSpace(connectionString);
if (runMigrations && !persistenceConfigured)
    throw new InvalidOperationException(
        "ConnectionStrings:Postgres is required when startup migrations are enabled.");
if (persistenceConfigured)
{
    builder.Services.AddToeicPostgres(connectionString!, Path.Combine(AppContext.BaseDirectory, "db"),
        runMigrations);
}

builder.Services.AddHealthChecks();
var app = builder.Build();
app.UseToeicApiPipeline();
app.MapHealthChecks("/health");
app.MapPlatformStatus(persistenceConfigured);
app.Run();
