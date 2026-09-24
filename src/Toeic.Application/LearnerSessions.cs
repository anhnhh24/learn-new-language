namespace Toeic.Application;

public sealed record LearnerSession(Guid UserId, Guid SessionId, string DisplayName);
public sealed record SessionToken(string AccessToken, DateTimeOffset ExpiresAt, string TokenType = "Bearer");

public interface ILearnerSessions
{
    Task<SessionToken?> LoginAsync(string email, string password, CancellationToken cancellationToken);
    Task<LearnerSession?> AuthenticateAsync(string token, CancellationToken cancellationToken);
    Task RevokeAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken);
}
