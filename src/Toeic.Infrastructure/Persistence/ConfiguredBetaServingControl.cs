using Toeic.Application;

namespace Toeic.Infrastructure.Persistence;

internal sealed class ConfiguredBetaServingControl(bool enabled) : IBetaServingControl
{
    public Task<bool> IsEnabledAsync(CancellationToken cancellationToken) =>
        Task.FromResult(enabled);
}
