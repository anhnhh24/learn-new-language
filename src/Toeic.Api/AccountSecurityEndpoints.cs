using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class AccountSecurityEndpoints
{
    public static void MapAccountSecurityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/me/security").RequireAuthorization();
        group.AddEndpointFilter(async (ctx,next) => { ctx.HttpContext.Response.Headers.CacheControl="no-store"; return await next(ctx); });
        group.MapGet("/sessions", async (HttpContext ctx, IAccountSecurity service, CancellationToken ct) =>
            Results.Ok(await service.SessionsAsync(User(ctx), Session(ctx), ct)));
        group.MapDelete("/sessions/{id:guid}", async (Guid id, HttpContext ctx, IAccountSecurity service, CancellationToken ct) =>
        {
            await service.RevokeAsync(User(ctx), id, ct); return Results.NoContent();
        });
        group.MapPost("/sessions/revoke-others", async (HttpContext ctx, IAccountSecurity service, CancellationToken ct) =>
        {
            await service.RevokeOthersAsync(User(ctx), Session(ctx), ct); return Results.NoContent();
        });
        group.MapPost("/password", async (ChangeAccountPassword request, HttpContext ctx, IAccountSecurity service, CancellationToken ct) =>
        {
            await service.ChangePasswordAsync(User(ctx), Session(ctx), request, ct); return Results.NoContent();
        }).RequireRateLimiting("login");
    }
    private static Guid User(HttpContext context) => Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static Guid Session(HttpContext context) => Guid.Parse(context.User.FindFirstValue("session_id")!);
}
