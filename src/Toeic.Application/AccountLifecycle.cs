namespace Toeic.Application;

public sealed record AccountRegistration(string DisplayName, string Email, string Password, bool TermsAccepted);

public interface IAccountLifecycle
{
    Task RegisterAsync(AccountRegistration registration, CancellationToken ct);
    Task RequestEmailAsync(string email, bool passwordReset, CancellationToken ct);
    Task VerifyEmailAsync(string token, CancellationToken ct);
    Task ResetPasswordAsync(string token, string password, CancellationToken ct);
}
