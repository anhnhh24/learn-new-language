using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class SupportEndpoints
{
    public static void MapSupportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/me/tickets").RequireAuthorization();
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            return await next(context);
        });
        group.MapPost("", async (CreateSupportTicket request, HttpContext context,
            ISupportTickets tickets, CancellationToken ct) =>
            Results.Ok(await tickets.CreateAsync(UserId(context), request, ct)));
        group.MapGet("", async (int? page, int? pageSize, HttpContext context,
            ISupportTickets tickets, CancellationToken ct) =>
            Results.Ok(await tickets.ListAsync(UserId(context), page ?? 1, pageSize ?? 20, ct)));
        group.MapGet("/{id:guid}", async (Guid id, HttpContext context,
            ISupportTickets tickets, CancellationToken ct) =>
            Results.Ok(await tickets.GetAsync(UserId(context), id, ct)));
    }

    private static Guid UserId(HttpContext context) =>
        Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
