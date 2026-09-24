using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;
using Toeic.Application;
using Toeic.Domain.Analytics;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

public static class PostgresServiceCollectionExtensions
{
    public static IServiceCollection AddToeicPostgres(this IServiceCollection services,
        string connectionString, string migrationDirectory, bool runMigrationsOnStartup,
        bool betaServingEnabled)
    {
        ArgumentNullException.ThrowIfNull(services);
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new DomainException("DATABASE_CONNECTION_STRING_REQUIRED");
        if (string.IsNullOrWhiteSpace(migrationDirectory))
            throw new DomainException("MIGRATION_DIRECTORY_INVALID");

        var settings = new NpgsqlConnectionStringBuilder(connectionString)
        {
            IncludeErrorDetail = false,
            ApplicationName = "Toeic.Api"
        };
        if (string.IsNullOrWhiteSpace(settings.Host) ||
            string.IsNullOrWhiteSpace(settings.Database) ||
            string.IsNullOrWhiteSpace(settings.Username))
            throw new DomainException("DATABASE_CONNECTION_STRING_INVALID");

        var dataSource = new NpgsqlDataSourceBuilder(settings.ConnectionString).Build();
        services.AddSingleton(dataSource);
        services.AddSingleton<IDbConnectionFactory, NpgsqlConnectionFactory>();
        services.AddSingleton(provider => new PostgresMigrationRunner(
            provider.GetRequiredService<IDbConnectionFactory>(), migrationDirectory,
            TimeProvider.System));
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<PostgresApplicationTransaction>();
        services.AddScoped<IApplicationTransaction>(provider =>
            provider.GetRequiredService<PostgresApplicationTransaction>());
        services.AddScoped<IPostgresSession>(provider =>
            provider.GetRequiredService<PostgresApplicationTransaction>());
        services.AddScoped<IItemTelemetryStore, PostgresItemTelemetryStore>();
        services.AddScoped<IAttemptStore, PostgresAttemptStore>();
        services.AddScoped<IStartAttemptReceiptStore, PostgresStartAttemptReceiptStore>();
        services.AddScoped<IContentBlueprintRepository, PostgresContentBlueprintRepository>();
        services.AddScoped<ICurriculumReader, PostgresCurriculumReader>();
        services.AddScoped<ILearnerLearning, PostgresLearnerLearning>();
        services.AddScoped<ILearnerToday, PostgresLearnerToday>();
        services.AddScoped<ILearnerProfile, PostgresLearnerProfile>();
        services.AddScoped<ISupportTickets, PostgresSupportTickets>();
        services.AddScoped<PostgresGenerationJobStore>();
        services.AddScoped<IAtomicGenerationJobStore>(provider =>
            provider.GetRequiredService<PostgresGenerationJobStore>());
        services.AddScoped<IAuditWriter, PostgresAuditWriter>();
        services.AddScoped<IOutboxWriter>(provider =>
            provider.GetRequiredService<PostgresGenerationJobStore>());
        services.AddScoped<IOutboxStore>(provider =>
            provider.GetRequiredService<PostgresGenerationJobStore>());
        services.AddScoped<OutboxDispatcher>();
        services.AddScoped<IIdempotencyReceiptStore, PostgresIdempotencyStore>();
        services.AddScoped<PostgresFormVersionStore>();
        services.AddScoped<IFormVersionStore>(provider =>
            provider.GetRequiredService<PostgresFormVersionStore>());
        services.AddScoped<IBetaFormReader>(provider =>
            provider.GetRequiredService<PostgresFormVersionStore>());
        services.AddScoped<IFormCandidateStore, PostgresFormCandidateStore>();
        services.AddScoped<IQuestionNodeStore, PostgresQuestionNodeStore>();
        services.AddSingleton<IBetaServingControl>(
            new ConfiguredBetaServingControl(betaServingEnabled));
        if (betaServingEnabled)
        {
            services.AddScoped<BetaServingService>();
            services.AddScoped<LearnerIssueReportService>();
        }
        services.AddScoped<FormCompositionService>();
        services.AddScoped<AutoQuarantineService>();
        services.AddHealthChecks()
            .AddCheck<PostgresHealthCheck>("postgres", tags: ["ready"]);
        if (runMigrationsOnStartup)
            services.AddHostedService<PostgresMigrationHostedService>();
        return services;
    }
}

internal sealed class PostgresMigrationHostedService(PostgresMigrationRunner migrations)
    : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken) =>
        await migrations.RunAsync(cancellationToken);

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
