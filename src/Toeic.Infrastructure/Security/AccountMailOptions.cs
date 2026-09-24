namespace Toeic.Infrastructure.Security;

public sealed class AccountMailOptions
{
    public string Mode { get; set; } = "Disabled";
    public string PublicWebUrl { get; set; } = "";
    public string From { get; set; } = "";
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUser { get; set; }
    public string? SmtpPassword { get; set; }
    public string? DevelopmentDirectory { get; set; }
    public string TermsVersion { get; set; } = "pilot-v1";
}

internal sealed record AccountMail(string Email, string Purpose, string Token);
