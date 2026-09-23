using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresHealthCheck(IDbConnectionFactory connections) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(3));
        try
        {
            await using var connection = await connections.OpenAsync(timeout.Token);
            await using var command = connection.CreateCommand();
            command.CommandText = "select 1;";
            command.CommandTimeout = 3;
            var result = await command.ExecuteScalarAsync(timeout.Token);
            return Convert.ToInt32(result) == 1
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("PostgreSQL readiness query failed.");
        }
        catch (Exception exception) when (exception is not OperationCanceledException ||
                                          !cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("PostgreSQL is unavailable.");
        }
    }
}
