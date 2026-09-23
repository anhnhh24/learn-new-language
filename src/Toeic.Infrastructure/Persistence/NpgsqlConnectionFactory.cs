using System.Data.Common;
using Npgsql;

namespace Toeic.Infrastructure.Persistence;

public sealed class NpgsqlConnectionFactory(NpgsqlDataSource dataSource) : IDbConnectionFactory
{
    public async Task<DbConnection> OpenAsync(CancellationToken cancellationToken) =>
        await dataSource.OpenConnectionAsync(cancellationToken);
}
