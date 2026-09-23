using System.Data.Common;
using Toeic.Application;

namespace Toeic.Infrastructure.Persistence;

internal interface IPostgresSession
{
    DbConnection Connection { get; }
    DbTransaction Transaction { get; }
}

internal sealed class PostgresApplicationTransaction(IDbConnectionFactory connections)
    : IApplicationTransaction, IPostgresSession
{
    private DbConnection? connection;
    private DbTransaction? transaction;

    public DbConnection Connection => connection ??
        throw new InvalidOperationException("No active application transaction.");
    public DbTransaction Transaction => transaction ??
        throw new InvalidOperationException("No active application transaction.");

    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(operation);
        if (transaction is not null) return await operation(cancellationToken);

        await using var openedConnection = await connections.OpenAsync(cancellationToken);
        await using var openedTransaction =
            await openedConnection.BeginTransactionAsync(cancellationToken);
        connection = openedConnection;
        transaction = openedTransaction;
        try
        {
            var result = await operation(cancellationToken);
            await openedTransaction.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            try
            {
                await openedTransaction.RollbackAsync(CancellationToken.None);
            }
            catch
            {
                // Preserve the application failure; disposing the transaction rolls it back.
            }
            throw;
        }
        finally
        {
            transaction = null;
            connection = null;
        }
    }
}
