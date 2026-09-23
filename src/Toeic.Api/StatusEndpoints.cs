namespace Toeic.Api;

public static class StatusEndpoints
{
    public static IEndpointRouteBuilder MapPlatformStatus(this IEndpointRouteBuilder endpoints,
        bool persistenceConfigured, bool analyticsPseudonymConfigured)
    {
        endpoints.MapGet("/api/v1/status", () => Results.Ok(new
        {
            release = "R0A-development",
            content = "internal-only",
            commerce = "PendingIntegration",
            persistence = persistenceConfigured ? "Configured" : "NotConfigured",
            analyticsPseudonym = analyticsPseudonymConfigured
                ? "Configured" : "NotConfigured",
            officialScoreEstimate = false,
            expertReviewedTier = false
        })).AllowAnonymous();

        return endpoints;
    }
}
