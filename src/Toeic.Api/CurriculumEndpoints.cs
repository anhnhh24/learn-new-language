using System.Security.Cryptography;
using System.Text;
using Toeic.Application;

namespace Toeic.Api;

public static class CurriculumEndpoints
{
    public static IEndpointRouteBuilder MapCurriculumEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var courses = endpoints.MapGroup("/api/v1/courses");

        courses.MapGet("", async (
            string? q,
            string? level,
            string? skill,
            ICurriculumReader reader,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            if (q?.Length > 100 || level?.Length > 50 || skill?.Length > 50)
                return Invalid("CURRICULUM_FILTER_INVALID", context.TraceIdentifier);

            var result = await reader.ListPublishedCoursesAsync(
                new CurriculumCatalogQuery(q, level, skill), cancellationToken);
            SetCatalogCache(context);
            return Results.Ok(new { items = result, count = result.Count });
        }).AllowAnonymous();

        courses.MapGet("/{slug}", async (
            string slug,
            ICurriculumReader reader,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            var course = await reader.FindPublishedCourseAsync(slug, cancellationToken);
            if (course is null) return NotFound(context.TraceIdentifier);
            if (IsNotModified(context, course.Course.Version))
                return Results.StatusCode(StatusCodes.Status304NotModified);
            SetVersionedCache(context, course.Course.Version);
            return Results.Ok(course);
        }).AllowAnonymous();

        courses.MapGet("/{slug}/roadmap", async (
            string slug,
            ICurriculumReader reader,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            var roadmap = await reader.FindPublishedRoadmapAsync(slug, cancellationToken);
            if (roadmap is null) return NotFound(context.TraceIdentifier);
            var version = $"{roadmap.CourseVersion}:{roadmap.Version}";
            if (IsNotModified(context, version))
                return Results.StatusCode(StatusCodes.Status304NotModified);
            SetVersionedCache(context, version);
            return Results.Ok(roadmap);
        }).AllowAnonymous();

        courses.MapGet("/{slug}/lessons/{lessonCode}/sample", async (
            string slug,
            string lessonCode,
            ICurriculumReader reader,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            var lesson = await reader.FindPublishedLessonAsync(
                slug, lessonCode, cancellationToken);
            if (lesson is null) return NotFound(context.TraceIdentifier);
            if (!lesson.IsSample &&
                !string.Equals(lesson.AccessModel, "Free", StringComparison.Ordinal))
            {
                return Results.Json(new
                {
                    code = "CONTENT_ACCESS_REQUIRED",
                    message = "Bài học này cần quyền truy cập khóa học.",
                    traceId = context.TraceIdentifier
                }, statusCode: StatusCodes.Status403Forbidden);
            }

            var version = $"{lesson.CourseVersion}:{lesson.Code}:{lesson.Version}";
            if (IsNotModified(context, version))
                return Results.StatusCode(StatusCodes.Status304NotModified);
            SetVersionedCache(context, version);
            return Results.Ok(lesson);
        }).AllowAnonymous();

        return endpoints;
    }

    private static IResult Invalid(string code, string traceId) =>
        Results.Json(new
        {
            code,
            message = "Bộ lọc khóa học không hợp lệ.",
            traceId
        }, statusCode: StatusCodes.Status422UnprocessableEntity);

    private static IResult NotFound(string traceId) =>
        Results.Json(new
        {
            code = "CURRICULUM_NOT_FOUND",
            message = "Không tìm thấy nội dung đã xuất bản.",
            traceId
        }, statusCode: StatusCodes.Status404NotFound);

    private static void SetCatalogCache(HttpContext context) =>
        context.Response.Headers.CacheControl = "public,max-age=60";

    private static void SetVersionedCache(HttpContext context, string version)
    {
        context.Response.Headers.CacheControl = "public,max-age=300";
        context.Response.Headers.ETag = CreateEtag(version);
    }

    private static bool IsNotModified(HttpContext context, string version)
    {
        var etag = CreateEtag(version);
        if (!context.Request.Headers.IfNoneMatch.Any(value =>
                string.Equals(value, etag, StringComparison.Ordinal)))
            return false;
        context.Response.Headers.ETag = etag;
        context.Response.Headers.CacheControl = "public,max-age=300";
        return true;
    }

    private static string CreateEtag(string version)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(version));
        return (char)34 + Convert.ToHexString(hash.AsSpan(0, 12)) + (char)34;
    }
}
