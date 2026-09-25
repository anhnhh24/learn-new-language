using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class ErrorNotebookEndpoints
{
    public static void MapErrorNotebookEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/me/errors").RequireAuthorization();
        group.AddEndpointFilter(async (ctx, next) =>
        {
            ctx.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(ctx);
        });
        group.MapGet("", async (string? state, string? tag, int? page, int? pageSize,
            HttpContext ctx, IErrorNotebook service, CancellationToken ct) =>
            Results.Ok(await service.ListAsync(User(ctx), state, tag, page ?? 1, pageSize ?? 20, ct)));
        group.MapGet("/summary", async (HttpContext ctx, IErrorNotebook service, CancellationToken ct) =>
            Results.Ok(await service.SummaryAsync(User(ctx), ct)));
        group.MapGet("/{id:guid}", async (Guid id, HttpContext ctx, IErrorNotebook service, CancellationToken ct) =>
            Results.Ok(await service.GetAsync(User(ctx), id, ct)));
        group.MapPut("/{id:guid}", async (Guid id, ChangeErrorEntry request, HttpContext ctx, IErrorNotebook service, CancellationToken ct) =>
            Results.Ok(await service.ChangeAsync(User(ctx), id, request, ct)));
        group.MapPost("/from-quiz", async (CaptureQuizErrors request, HttpContext ctx, IErrorNotebook service, CancellationToken ct) =>
            Results.Ok(await service.CaptureAsync(User(ctx), request, ct)));
    }
    private static Guid User(HttpContext context) => Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
