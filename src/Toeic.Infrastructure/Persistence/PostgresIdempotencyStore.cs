using System.Data.Common;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresIdempotencyStore(IPostgresSession session) : IIdempotencyReceiptStore
{
    public async Task<IdempotencyReceipt?> FindAsync(string scope, Guid key,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(scope) || key == Guid.Empty) return null;
        await using var command = CreateCommand("""
            select scope, idempotency_key, request_hash, response_status,
                   response_json::text, expires_at
            from operations.idempotency_records
            where scope = @scope and idempotency_key = @key and expires_at > now();
            """);
        Add(command, "@scope", scope);
        Add(command, "@key", key);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return new(reader.GetString(0), reader.GetGuid(1), reader.GetString(2),
            reader.GetInt32(3), reader.GetString(4),
            reader.GetFieldValue<DateTimeOffset>(5));
    }

    public async Task StoreAsync(IdempotencyReceipt receipt,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(receipt);
        if (string.IsNullOrWhiteSpace(receipt.Scope) || receipt.Key == Guid.Empty ||
            string.IsNullOrWhiteSpace(receipt.RequestHash) ||
            string.IsNullOrWhiteSpace(receipt.ResponseJson))
            throw new DomainException("IDEMPOTENCY_RECEIPT_INVALID");
        await using var command = CreateCommand("""
            insert into operations.idempotency_records
                (scope, idempotency_key, request_hash, response_status, response_json, expires_at)
            values (@scope, @key, @request_hash, @response_status,
                    cast(@response_json as jsonb), @expires_at)
            on conflict (scope, idempotency_key) do nothing;
            """);
        Add(command, "@scope", receipt.Scope);
        Add(command, "@key", receipt.Key);
        Add(command, "@request_hash", receipt.RequestHash);
        Add(command, "@response_status", receipt.StatusCode);
        Add(command, "@response_json", receipt.ResponseJson);
        Add(command, "@expires_at", receipt.ExpiresAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private DbCommand CreateCommand(string sql)
    {
        var command = session.Connection.CreateCommand();
        command.Transaction = session.Transaction;
        command.CommandText = sql;
        return command;
    }

    private static void Add(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
