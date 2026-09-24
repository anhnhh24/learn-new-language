using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class LearnerEndpoints
{
    public sealed record EnrollRequest(Guid CourseVersionId);

    public static void MapLearnerEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/me").RequireAuthorization();
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(context);
        });
        group.MapGet("/today", async (HttpContext http, ILearnerToday today,
            CancellationToken ct) => Results.Ok(await today.GetAsync(UserId(http), ct)));
        group.MapGet("/enrollments/{enrollmentId:guid}/roadmap",
            async (Guid enrollmentId, HttpContext http, ILearnerLearning learning,
                ICurriculumReader curriculum, CancellationToken ct) =>
            {
                var enrollment = (await learning.ListEnrollmentsAsync(UserId(http), ct))
                    .FirstOrDefault(item => item.Id == enrollmentId)
                    ?? throw new Toeic.Domain.Content.DomainException("ENROLLMENT_NOT_FOUND");
                var roadmap = await curriculum.FindPublishedRoadmapAsync(
                    enrollment.CourseSlug, ct, enrollment.CourseVersionId)
                    ?? throw new Toeic.Domain.Content.DomainException("ROADMAP_NOT_FOUND");
                return Results.Ok(roadmap);
            });
        group.MapGet("/enrollments", async (HttpContext http, ILearnerLearning learning,
            CancellationToken ct) => Results.Ok(
                await learning.ListEnrollmentsAsync(UserId(http), ct)));
        group.MapPost("/enrollments", async (EnrollRequest request, HttpContext http,
            ILearnerLearning learning, CancellationToken ct) => Results.Ok(
                await learning.EnrollAsync(UserId(http), request.CourseVersionId, ct)));
        group.MapGet("/enrollments/{enrollmentId:guid}/lessons/{lessonCode}",
            async (Guid enrollmentId, string lessonCode, HttpContext http,
                ILearnerLearning learning, CancellationToken ct) => Results.Ok(
                await learning.ReadLessonAsync(UserId(http), enrollmentId, lessonCode, ct)));
        group.MapGet("/lessons/{lessonId:guid}/progress", async (Guid lessonId,
            HttpContext http, ILearnerLearning learning, CancellationToken ct) => Results.Ok(
                await learning.ReadProgressAsync(UserId(http), lessonId, ct)));
        group.MapPut("/lessons/{lessonId:guid}/progress", async (Guid lessonId,
            SaveReadingProgress request, HttpContext http, ILearnerLearning learning,
            CancellationToken ct) => Results.Ok(
                await learning.SaveProgressAsync(UserId(http), lessonId, request, ct)));
    }

    private static Guid UserId(HttpContext context) =>
        Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
