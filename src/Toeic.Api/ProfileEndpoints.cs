using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/me/profile").RequireAuthorization();
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(context);
        });
        group.MapGet("", async (HttpContext context, ILearnerProfile profiles, CancellationToken ct) =>
            Results.Ok(await profiles.GetAsync(UserId(context), ct)));
        group.MapPut("", async (SaveLearnerProfile request, HttpContext context,
            ILearnerProfile profiles, CancellationToken ct) =>
            Results.Ok(await profiles.SaveAsync(UserId(context), request, ct)));
    }

    private static Guid UserId(HttpContext context) =>
        Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
