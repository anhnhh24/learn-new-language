using System.Data.Common;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

public sealed record AppliedMigration(string Name, string Sha256, DateTimeOffset AppliedAt);

public sealed partial class PostgresMigrationRunner(IDbConnectionFactory connections,
    string migrationDirectory, TimeProvider clock)
{
    private const long AdvisoryLockId = 8_477_642_390_131;

    public async Task<IReadOnlyList<AppliedMigration>> RunAsync(
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(migrationDirectory) ||
            !Directory.Exists(migrationDirectory))
            throw new DomainException("MIGRATION_DIRECTORY_INVALID");

        var paths = Directory.EnumerateFiles(migrationDirectory, "*.sql",
                SearchOption.TopDirectoryOnly)
            .OrderBy(Path.GetFileName, StringComparer.Ordinal)
            .ToArray();
        if (paths.Length == 0 || paths.Any(path =>
                !MigrationNamePattern().IsMatch(Path.GetFileName(path))))
            throw new DomainException("MIGRATION_SET_INVALID");

        await using var connection = await connections.OpenAsync(cancellationToken);
        if (connection.State != System.Data.ConnectionState.Open)
            throw new DomainException("DATABASE_CONNECTION_NOT_OPEN");

        await ExecuteAsync(connection, null, """
            create schema if not exists operations;
            create table if not exists operations.schema_migrations (
                name text primary key,
                sha256 char(64) not null,
                applied_at timestamptz not null
            );
            """, cancellationToken);
        await ExecuteAsync(connection, null,
            $"select pg_advisory_lock({AdvisoryLockId});", cancellationToken);

        Exception? runFailure = null;
        try
        {
            var applied = new List<AppliedMigration>();
            foreach (var path in paths)
            {
                var name = Path.GetFileName(path);
                var sql = await File.ReadAllTextAsync(path, Encoding.UTF8, cancellationToken);
                var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sql)));
                var existingHash = await FindHashAsync(connection, name, cancellationToken);
                if (existingHash is not null)
                {
                    if (!string.Equals(existingHash, hash, StringComparison.Ordinal))
                        throw new DomainException("MIGRATION_HASH_MISMATCH");
                    continue;
                }

                await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
                try
                {
                    await ExecuteAsync(connection, transaction, sql, cancellationToken);
                    var appliedAt = clock.GetUtcNow();
                    await InsertJournalAsync(connection, transaction, name, hash, appliedAt,
                        cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                    applied.Add(new(name, hash, appliedAt));
                }
                catch
                {
                    await transaction.RollbackAsync(CancellationToken.None);
                    throw;
                }
            }
            return applied;
        }
        catch (Exception exception)
        {
            runFailure = exception;
            throw;
        }
        finally
        {
            try
            {
                await ExecuteAsync(connection, null,
                    $"select pg_advisory_unlock({AdvisoryLockId});", CancellationToken.None);
            }
            catch when (runFailure is not null)
            {
                // Preserve the migration failure; closing the connection releases the session lock.
            }
        }
    }

    private static async Task<string?> FindHashAsync(DbConnection connection, string name,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText =
            "select sha256 from operations.schema_migrations where name = @name;";
        AddParameter(command, "@name", name);
        return (string?)await command.ExecuteScalarAsync(cancellationToken);
    }

    private static async Task InsertJournalAsync(DbConnection connection,
        DbTransaction transaction, string name, string hash, DateTimeOffset appliedAt,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            insert into operations.schema_migrations(name, sha256, applied_at)
            values (@name, @sha256, @applied_at);
            """;
        AddParameter(command, "@name", name);
        AddParameter(command, "@sha256", hash);
        AddParameter(command, "@applied_at", appliedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task ExecuteAsync(DbConnection connection,
        DbTransaction? transaction, string sql, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = sql;
        command.CommandTimeout = 120;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static void AddParameter(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    [GeneratedRegex("^[0-9]{3}_[a-z0-9_]+\\.sql$", RegexOptions.CultureInvariant)]
    private static partial Regex MigrationNamePattern();
}
