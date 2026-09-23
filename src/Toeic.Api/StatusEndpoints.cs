namespace Toeic.Api;

public static class StatusEndpoints
{
    public static IEndpointRouteBuilder MapPlatformStatus(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/status", () => Results.Ok(new
        {
            release = "R0A-development",
            content = "internal-only",
            commerce = "PendingIntegration",
            officialScoreEstimate = false,
            expertReviewedTier = false
        })).AllowAnonymous();

        return endpoints;
    }
}
