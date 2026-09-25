using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/me/dashboard", async (int? days, int? coursePage, int? coursePageSize,
            HttpContext context, ILearnerDashboard dashboard, CancellationToken ct) =>
        {
            context.Response.Headers.CacheControl = "no-store";
            var user = Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Results.Ok(await dashboard.GetAsync(user, days ?? 30, coursePage ?? 1, coursePageSize ?? 10, ct));
        }).RequireAuthorization();
    }
}
