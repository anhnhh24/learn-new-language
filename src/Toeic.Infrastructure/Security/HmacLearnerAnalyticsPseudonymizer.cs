using System.Security.Cryptography;
using System.Text;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Security;

public sealed class HmacLearnerAnalyticsPseudonymizer :
    ILearnerAnalyticsPseudonymizer, IDisposable
{
    private readonly byte[] key;
    private bool disposed;

    public HmacLearnerAnalyticsPseudonymizer(string keyBase64)
    {
        try
        {
            key = Convert.FromBase64String(keyBase64 ?? string.Empty);
        }
        catch (FormatException)
        {
            throw new DomainException("ANALYTICS_PSEUDONYM_KEY_INVALID");
        }
        if (key.Length < 32)
        {
            CryptographicOperations.ZeroMemory(key);
            throw new DomainException("ANALYTICS_PSEUDONYM_KEY_INVALID");
        }
    }

    public string Pseudonymize(string learnerId)
    {
        ObjectDisposedException.ThrowIf(disposed, this);
        if (string.IsNullOrWhiteSpace(learnerId))
            throw new DomainException("ANALYTICS_PSEUDONYM_INPUT_INVALID");
        var input = Encoding.UTF8.GetBytes($"toeic-learner:v1:{learnerId.Trim()}");
        try
        {
            return Convert.ToHexString(HMACSHA256.HashData(key, input));
        }
        finally
        {
            CryptographicOperations.ZeroMemory(input);
        }
    }

    public void Dispose()
    {
        if (disposed) return;
        CryptographicOperations.ZeroMemory(key);
        disposed = true;
    }
}
