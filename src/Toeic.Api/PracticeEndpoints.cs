using System.Security.Claims;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Api;

public static class PracticeEndpoints
{
    public static void MapPracticeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group=endpoints.MapGroup("/api/v1/me/practice").RequireAuthorization();
        group.AddEndpointFilter(async(ctx,next)=>{ctx.HttpContext.Response.Headers.CacheControl="no-store";return await next(ctx);});
        group.MapGet("/forms",async(int? page,int? pageSize,HttpContext ctx,IPracticeExams service,CancellationToken ct)=>Results.Ok(await service.CatalogAsync(User(ctx),page??1,pageSize??20,ct)));
        group.MapGet("/attempts",async(int? page,int? pageSize,HttpContext ctx,IPracticeExams service,CancellationToken ct)=>Results.Ok(await service.HistoryAsync(User(ctx),page??1,pageSize??20,ct)));
        group.MapPost("/attempts",async(StartPractice request,HttpContext ctx,IPracticeExams service,CancellationToken ct)=>Results.Ok(await service.StartAsync(User(ctx),request,ct)));
        group.MapGet("/attempts/{id:guid}",async(Guid id,HttpContext ctx,IPracticeExams service,CancellationToken ct)=>Results.Ok(await service.GetAsync(User(ctx),id,ct)));
        group.MapPut("/attempts/{id:guid}/lease",async(Guid id,PracticeLease request,HttpContext ctx,IPracticeExams service,CancellationToken ct)=>Results.Ok(await service.LeaseAsync(User(ctx),id,request,ct)));
        group.MapPut("/attempts/{id:guid}/answer",async(Guid id,SavePracticeAnswer request,HttpContext ctx,IPracticeExams service,CancellationToken ct)=>Results.Ok(await service.SaveAsync(User(ctx),id,request,ct)));
        group.MapPost("/attempts/{id:guid}/submit",async(Guid id,SubmitPractice request,HttpContext ctx,IPracticeExams service,CancellationToken ct)=>Results.Ok(await service.SubmitAsync(User(ctx),id,request,ct)));
        group.MapPost("/reports",async(ReportIssueCommand request,HttpContext ctx,LearnerIssueReportService service,CancellationToken ct)=>
            Results.Ok(await service.ReportAsync(request,new Actor(ActorType.Learner,User(ctx).ToString()),ct)));
    }
    private static Guid User(HttpContext context)=>Guid.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
