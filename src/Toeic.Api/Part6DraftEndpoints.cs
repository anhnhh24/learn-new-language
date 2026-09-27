using System.Security.Claims;
using Toeic.Application;
namespace Toeic.Api;
public static class Part6DraftEndpoints
{
 public static void MapPart6DraftEndpoints(this IEndpointRouteBuilder endpoints)
 {
  var group=endpoints.MapGroup("/api/v1/admin/part6-drafts").RequireAuthorization(AdminAuthentication.PolicyName); group.AddEndpointFilter(async(ctx,next)=>{ctx.HttpContext.Response.Headers.CacheControl="no-store";return await next(ctx);});
  group.MapGet("/blueprints",async(int? page,IPart6Drafts drafts,CancellationToken ct)=>Results.Ok(await drafts.BlueprintsAsync(page??1,ct))); group.MapGet("/",async(int? page,IPart6Drafts drafts,CancellationToken ct)=>Results.Ok(await drafts.ListAsync(page??1,ct))); group.MapGet("/{id:guid}",async(Guid id,IPart6Drafts drafts,CancellationToken ct)=>Results.Ok(await drafts.GetAsync(id,ct))); group.MapPost("/",async(CreatePart6Draft request,HttpContext ctx,IPart6Drafts drafts,CancellationToken ct)=>Results.Ok(await drafts.CreateAsync(User(ctx),request,ct))); group.MapPut("/{id:guid}",async(Guid id,SavePart6Draft request,HttpContext ctx,IPart6Drafts drafts,CancellationToken ct)=>Results.Ok(await drafts.SaveAsync(User(ctx),id,request,ct))); group.MapPost("/{id:guid}/validate",async(Guid id,DraftRevision request,HttpContext ctx,IPart6Drafts drafts,CancellationToken ct)=>Results.Ok(await drafts.ValidateAsync(User(ctx),id,request,false,ct))); group.MapPost("/{id:guid}/submit",async(Guid id,DraftRevision request,HttpContext ctx,IPart6Drafts drafts,CancellationToken ct)=>Results.Ok(await drafts.ValidateAsync(User(ctx),id,request,true,ct)));
 }
 private static Guid User(HttpContext ctx)=>Guid.Parse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
