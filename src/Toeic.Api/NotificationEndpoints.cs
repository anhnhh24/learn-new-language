using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/me/notifications").RequireAuthorization();
        group.AddEndpointFilter(async (ctx,next) => { ctx.HttpContext.Response.Headers.CacheControl="no-store"; return await next(ctx); });
        group.MapGet("", async (int? page, int? pageSize, bool? unreadOnly, HttpContext ctx, ILearnerNotifications service, CancellationToken ct) =>
            Results.Ok(await service.ListAsync(User(ctx), page ?? 1, pageSize ?? 20, unreadOnly ?? false, ct)));
        group.MapGet("/unread-count", async (HttpContext ctx, ILearnerNotifications service, CancellationToken ct) =>
            Results.Ok(new { count = await service.UnreadAsync(User(ctx), ct) }));
        group.MapPut("/{id:guid}/read", async (Guid id, HttpContext ctx, ILearnerNotifications service, CancellationToken ct) =>
        {
            await service.ReadAsync(User(ctx), id, ct); return Results.NoContent();
        });
    }
    private static Guid User(HttpContext context) => Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
