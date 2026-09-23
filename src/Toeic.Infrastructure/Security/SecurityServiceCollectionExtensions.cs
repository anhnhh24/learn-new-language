using Microsoft.Extensions.DependencyInjection;
using Toeic.Application;

namespace Toeic.Infrastructure.Security;

public static class SecurityServiceCollectionExtensions
{
    public static IServiceCollection AddToeicAnalyticsPseudonymizer(
        this IServiceCollection services, string keyBase64)
    {
        ArgumentNullException.ThrowIfNull(services);
        var pseudonymizer = new HmacLearnerAnalyticsPseudonymizer(keyBase64);
        services.AddSingleton<ILearnerAnalyticsPseudonymizer>(pseudonymizer);
        return services;
    }
}
