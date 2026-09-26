using System.Security.Claims;
using Toeic.Application;

namespace Toeic.Api;

public static class AdminEndpoints
{
    public sealed record Login(string Email,string Password);
    public static void MapAdminEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapQuestionDraftEndpoints();
        endpoints.MapPost("/api/v1/admin/auth/login",async(Login request,IAdminSessions sessions,HttpContext ctx,CancellationToken ct)=>
        {
            ctx.Response.Headers.CacheControl="no-store";
            var token=await sessions.LoginAsync(request.Email,request.Password,ct);
            return token is null ? Results.Json(new {code="ADMIN_LOGIN_FAILED",message="Không thể đăng nhập quản trị bằng thông tin này."},statusCode:401) : Results.Ok(token);
        }).AllowAnonymous().RequireRateLimiting("admin-login");
        var group=endpoints.MapGroup("/api/v1/admin").RequireAuthorization(AdminAuthentication.PolicyName);
        group.AddEndpointFilter(async(ctx,next)=>{ctx.HttpContext.Response.Headers.CacheControl="no-store";return await next(ctx);});
        group.MapGet("/auth/me",(HttpContext ctx)=>Results.Ok(new {userId=ctx.User.FindFirstValue(ClaimTypes.NameIdentifier),displayName=ctx.User.FindFirstValue(ClaimTypes.Name),role="Admin"}));
        group.MapPost("/auth/logout",async(HttpContext ctx,IAdminSessions sessions,CancellationToken ct)=>
        {
            await sessions.LogoutAsync(Guid.Parse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)!),Guid.Parse(ctx.User.FindFirstValue("admin_session_id")!),ct);
            return Results.NoContent();
        });
        group.MapGet("/resources/{kind}",async(string kind,int? page,int? pageSize,IAdminConsole admin,CancellationToken ct)=>Results.Ok(await admin.ResourcesAsync(kind,page??1,pageSize??20,ct)));
        group.MapGet("/exams", async(int? page,string? state,IAdminExams exams,CancellationToken ct)=>Results.Ok(await exams.ListAsync(page??1,state,ct)));
        group.MapGet("/exams/sources", async(int? page,string? policy,IAdminExams exams,CancellationToken ct)=>Results.Ok(await exams.SourcesAsync(page??1,policy,ct)));
        group.MapGet("/exams/sources/{id:guid}", async(Guid id,IAdminExams exams,CancellationToken ct)=>Results.Ok(await exams.SourceAsync(id,ct)));
        group.MapGet("/exams/{id:guid}", async(Guid id,IAdminExams exams,CancellationToken ct)=>Results.Ok(await exams.DetailAsync(id,ct)));
        group.MapPost("/exams", async(PublishAdminExam request,HttpContext ctx,IAdminExams exams,CancellationToken ct)=>Results.Ok(new {id=await exams.PublishAsync(Guid.Parse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)!),request,ct)}));
        group.MapPost("/exams/{id:guid}/archive", async(Guid id,ArchiveAdminExam request,HttpContext ctx,IAdminExams exams,CancellationToken ct)=>
        {
            await exams.ArchiveAsync(Guid.Parse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)!),id,request,ct);
            return Results.NoContent();
        });
        group.MapGet("/overview",async(IAdminConsole admin,CancellationToken ct)=>Results.Ok(await admin.OverviewAsync(ct)));
        group.MapGet("/users",async(int? page,int? pageSize,IAdminConsole admin,CancellationToken ct)=>Results.Ok(await admin.UsersAsync(page??1,pageSize??20,ct)));
        group.MapGet("/tickets",async(int? page,int? pageSize,string? state,IAdminConsole admin,CancellationToken ct)=>Results.Ok(await admin.TicketsAsync(page??1,pageSize??20,state,ct)));
        group.MapGet("/audit",async(int? page,int? pageSize,IAdminConsole admin,CancellationToken ct)=>Results.Ok(await admin.AuditAsync(page??1,pageSize??20,ct)));
    }
}
