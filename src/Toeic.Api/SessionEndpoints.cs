using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class SessionEndpoints
{
    public sealed record LoginRequest(string Email, string Password);
    public sealed record RegisterRequest(string DisplayName, string Email, string Password);

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

        endpoints.MapPost("/api/v1/auth/register", async (RegisterRequest request,
            ILearnerSessions sessions, HttpContext context, CancellationToken ct) =>
        {
            context.Response.Headers.CacheControl = "no-store";
            if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Trim().Length < 2)
            {
                return Results.Json(new { code = "INVALID_DISPLAY_NAME",
                    message = "Tên hiển thị phải có từ 2 ký tự trở lên." }, statusCode: 400);
            }
            if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            {
                return Results.Json(new { code = "INVALID_EMAIL",
                    message = "Địa chỉ email không hợp lệ." }, statusCode: 400);
            }
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 12)
            {
                return Results.Json(new { code = "PASSWORD_TOO_SHORT",
                    message = "Mật khẩu phải chứa ít nhất 12 ký tự." }, statusCode: 400);
            }

            var result = await sessions.RegisterAsync(request.DisplayName, request.Email, request.Password, ct);
            if (!result.Success)
            {
                var statusCode = result.ErrorCode == "EMAIL_EXISTS" ? 409 : 400;
                return Results.Json(new { code = result.ErrorCode, message = result.ErrorMessage }, statusCode: statusCode);
            }

            return Results.Json(result.Token, statusCode: 201);
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
