using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class SessionEndpoints
{
    public sealed record LoginRequest(string Email, string Password);

    public static void MapSessionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/v1/auth/login", async (LoginRequest request,
            ILearnerSessions sessions, HttpContext context, CancellationToken ct) =>
        {
            context.Response.Headers.CacheControl = "no-store";
            var token = await sessions.LoginAsync(request.Email, request.Password, ct);
            return token is null
                ? Results.Json(new { code = "LOGIN_FAILED",
                    message = "Không thể đăng nhập bằng thông tin này." }, statusCode: 401)
                : Results.Ok(token);
        }).AllowAnonymous().RequireRateLimiting("login");

        endpoints.MapGet("/api/v1/auth/me", (HttpContext context) =>
        {
            context.Response.Headers.CacheControl = "no-store";
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var displayName = context.User.FindFirstValue(ClaimTypes.Name);
            return Results.Ok(new { userId, displayName });
        }).RequireAuthorization();

        endpoints.MapPost("/api/v1/auth/logout", async (
            ILearnerSessions sessions, HttpContext context, CancellationToken ct) =>
        {
            var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var sessionIdClaim = context.User.FindFirstValue("session_id");
            if (Guid.TryParse(userIdClaim, out var userId) && Guid.TryParse(sessionIdClaim, out var sessionId))
            {
                await sessions.RevokeAsync(userId, sessionId, ct);
            }
            context.Response.Headers.CacheControl = "no-store";
            return Results.NoContent();
        }).RequireAuthorization();
    }
}
