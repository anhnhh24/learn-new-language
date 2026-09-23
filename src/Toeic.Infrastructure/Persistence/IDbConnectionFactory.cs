using System.Data.Common;

namespace Toeic.Infrastructure.Persistence;

public interface IDbConnectionFactory
{
    Task<DbConnection> OpenAsync(CancellationToken cancellationToken);
}
