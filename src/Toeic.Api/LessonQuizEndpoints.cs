using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class LessonQuizEndpoints
{
    public static void MapLessonQuizEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/me").RequireAuthorization();
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(context);
        });
        group.MapPost("/lessons/{lesson:guid}/quiz-attempts", async (Guid lesson, StartLessonQuiz request,
            HttpContext ctx, ILessonQuizzes service, CancellationToken ct) => Results.Ok(await service.StartAsync(User(ctx), lesson, request, ct)));
        group.MapGet("/lessons/{lesson:guid}/quiz-attempts", async (Guid lesson, int? page, int? pageSize,
            HttpContext ctx, ILessonQuizzes service, CancellationToken ct) => Results.Ok(await service.HistoryAsync(User(ctx), lesson, page ?? 1, pageSize ?? 20, ct)));
        group.MapGet("/quiz-attempts/{id:guid}", async (Guid id, HttpContext ctx, ILessonQuizzes service,
            CancellationToken ct) => Results.Ok(await service.GetAsync(User(ctx), id, ct)));
        group.MapPut("/quiz-attempts/{id:guid}/answer", async (Guid id, SaveQuizAnswer request,
            HttpContext ctx, ILessonQuizzes service, CancellationToken ct) => Results.Ok(await service.SaveAsync(User(ctx), id, request, ct)));
        group.MapPost("/quiz-attempts/{id:guid}/submit", async (Guid id, SubmitLessonQuiz request,
            HttpContext ctx, ILessonQuizzes service, CancellationToken ct) => Results.Ok(await service.SubmitAsync(User(ctx), id, request, ct)));
    }

    private static Guid User(HttpContext context) => Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
