using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class FlashcardEndpoints
{
    public static void MapFlashcardEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/me/flashcards").RequireAuthorization();
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(context);
        });
        group.MapPost("", async (CreateFlashcard request, HttpContext ctx, IFlashcardReview service, CancellationToken ct) =>
            Results.Ok(await service.CreateAsync(User(ctx), request, ct)));
        group.MapGet("", async (int? page, int? pageSize, bool? archived, HttpContext ctx, IFlashcardReview service, CancellationToken ct) =>
            Results.Ok(await service.ListAsync(User(ctx), page ?? 1, pageSize ?? 20, archived ?? false, ct)));
        group.MapPut("/{id:guid}", async (Guid id, EditFlashcard request, HttpContext ctx, IFlashcardReview service, CancellationToken ct) =>
            Results.Ok(await service.EditAsync(User(ctx), id, request, ct)));
        group.MapGet("/queue", async (int? limit, HttpContext ctx, IFlashcardReview service, CancellationToken ct) =>
            Results.Ok(await service.QueueAsync(User(ctx), limit ?? 20, ct)));
        group.MapPost("/{id:guid}/reveal", async (Guid id, RevealFlashcard request, HttpContext ctx, IFlashcardReview service, CancellationToken ct) =>
            Results.Ok(await service.RevealAsync(User(ctx), id, request, ct)));
        group.MapPost("/{id:guid}/reviews", async (Guid id, RateFlashcard request, HttpContext ctx, IFlashcardReview service, CancellationToken ct) =>
            Results.Ok(await service.RateAsync(User(ctx), id, request, ct)));
        group.MapGet("/settings", async (HttpContext ctx, IFlashcardReview service, CancellationToken ct) =>
            Results.Ok(await service.SettingsAsync(User(ctx), null, ct)));
        group.MapPut("/settings", async (ChangeFlashcardSettings request, HttpContext ctx, IFlashcardReview service, CancellationToken ct) =>
            Results.Ok(await service.SettingsAsync(User(ctx), request, ct)));
    }

    private static Guid User(HttpContext context) => Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
