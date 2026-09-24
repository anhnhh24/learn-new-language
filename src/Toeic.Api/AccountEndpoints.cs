using Toeic.Application;

namespace Toeic.Api;

public static class AccountEndpoints
{
    public sealed record EmailRequest(string Email);
    public sealed record TokenRequest(string Token);
    public sealed record ResetRequest(string Token, string Password);

    public static void MapAccountEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/auth").AllowAnonymous().RequireRateLimiting("login");
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(context);
        });
        group.MapPost("/register", async (AccountRegistration request, IAccountLifecycle accounts,
            CancellationToken ct) =>
        {
            await accounts.RegisterAsync(request, ct);
            return Accepted();
        });
        group.MapPost("/resend-verification", async (EmailRequest request, IAccountLifecycle accounts,
            CancellationToken ct) =>
        {
            await accounts.RequestEmailAsync(request.Email, false, ct);
            return Accepted();
        });
        group.MapPost("/forgot-password", async (EmailRequest request, IAccountLifecycle accounts,
            CancellationToken ct) =>
        {
            await accounts.RequestEmailAsync(request.Email, true, ct);
            return Accepted();
        });
        group.MapPost("/verify-email", async (TokenRequest request, IAccountLifecycle accounts,
            CancellationToken ct) =>
        {
            await accounts.VerifyEmailAsync(request.Token, ct);
            return Results.NoContent();
        });
        group.MapPost("/reset-password", async (ResetRequest request, IAccountLifecycle accounts,
            CancellationToken ct) =>
        {
            await accounts.ResetPasswordAsync(request.Token, request.Password, ct);
            return Results.NoContent();
        });
    }

    private static IResult Accepted() => Results.Json(new {
        status = "Accepted",
        message = "Nếu yêu cầu phù hợp, hướng dẫn sẽ được gửi tới email của bạn."
    }, statusCode: StatusCodes.Status202Accepted);
}
