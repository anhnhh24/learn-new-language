using Toeic.Domain.Content;

namespace Toeic.Api;

public static class ApiPipeline
{
    public static IApplicationBuilder UseToeicApiPipeline(this IApplicationBuilder app)
    {
        app.Use(async (context, next) =>
        {
            var supplied = context.Request.Headers["X-Correlation-ID"].FirstOrDefault();
            var correlationId = IsSafeCorrelationId(supplied)
                ? supplied!
                : Guid.NewGuid().ToString("N");
            context.TraceIdentifier = correlationId;
            context.Response.Headers["X-Correlation-ID"] = correlationId;
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["Referrer-Policy"] = "no-referrer";
            context.Response.Headers["X-Frame-Options"] = "DENY";

            try
            {
                await next(context);
            }
            catch (DomainException exception)
            {
                if (context.Response.HasStarted) throw;
                context.Response.StatusCode = StatusFor(exception.Code);
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new
                {
                    code = exception.Code,
                    message = SafeMessage(exception.Code),
                    traceId = correlationId
                });
            }
        });

        return app;
    }

    private static bool IsSafeCorrelationId(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Length <= 100 &&
        value.All(character => char.IsAsciiLetterOrDigit(character) || character is '-' or '_');

    private static int StatusFor(string code)
    {
        if (code == "FORBIDDEN") return StatusCodes.Status403Forbidden;
        if (code.EndsWith("_NOT_FOUND", StringComparison.Ordinal)) return StatusCodes.Status404NotFound;
        if (code.Contains("CONFLICT", StringComparison.Ordinal) ||
            code is "ATTEMPT_ALREADY_SUBMITTED" or "TOKEN_ALREADY_USED")
            return StatusCodes.Status409Conflict;
        if (code.Contains("RATE_LIMIT", StringComparison.Ordinal)) return StatusCodes.Status429TooManyRequests;
        return StatusCodes.Status422UnprocessableEntity;
    }

    private static string SafeMessage(string code) => code switch
    {
        "FORBIDDEN" => "Bạn không có quyền thực hiện thao tác này.",
        "ATTEMPT_NOT_FOUND" or "ORDER_NOT_FOUND" or "ENROLLMENT_NOT_FOUND" =>
            "Không tìm thấy tài nguyên.",
        "RESPONSE_CONFLICT" or "PROGRESS_CONFLICT" or "ATTEMPT_REVISION_CONFLICT" =>
            "Dữ liệu đã thay đổi. Vui lòng tải phiên bản mới nhất.",
        "COMMERCE_PENDING" => "Thanh toán đang được chuẩn bị và chưa mở.",
        "GENERATION_DISABLED" => "Chức năng tạo nội dung đang tạm dừng.",
        _ => "Yêu cầu chưa hợp lệ. Vui lòng kiểm tra dữ liệu gửi lên."
    };
}
