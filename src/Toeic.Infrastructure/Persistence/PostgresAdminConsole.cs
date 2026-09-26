using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

public sealed class PostgresAdminConsole(IDbConnectionFactory connections) : IAdminConsole
{
    public async Task<AdminOverview> OverviewAsync(CancellationToken ct)
    {
        await using var db=await connections.OpenAsync(ct);
        await using var query=db.Query("""
            select (select count(*)::int from identity_data.users where status='Active'),
              (select count(*)::int from learning.course_versions where state='Published'),
              (select count(*)::int from learning.lesson_versions where state='Published'),
              (select count(*)::int from operations.support_tickets where state in ('Open','InProgress')),
              (select count(*)::int from content.form_versions where state='Active'),
              (select count(*)::int from content.question_revisions where state='Quarantined')
            """);
        await using var reader=await query.ExecuteReaderAsync(ct); await reader.ReadAsync(ct);
        return new(reader.GetInt32(0),reader.GetInt32(1),reader.GetInt32(2),reader.GetInt32(3),reader.GetInt32(4),reader.GetInt32(5));
    }
    public async Task<AdminPage<AdminUserView>> UsersAsync(int page,int pageSize,CancellationToken ct)
    {
        Validate(page,pageSize); await using var db=await connections.OpenAsync(ct);
        await using var query=db.Query("select id,display_name,status,created_at,email_verified_at is not null from identity_data.users order by created_at desc,id limit @take offset @skip",null,
            ("take",pageSize+1),("skip",(page-1)*pageSize));
        var items=new List<AdminUserView>(); await using var reader=await query.ExecuteReaderAsync(ct);
        while(await reader.ReadAsync(ct)) items.Add(new(reader.GetGuid(0),reader.GetString(1),reader.GetString(2),reader.GetFieldValue<DateTimeOffset>(3),reader.GetBoolean(4)));
        return new(items.Take(pageSize).ToArray(),page,pageSize,items.Count>pageSize);
    }
    public async Task<AdminPage<SupportTicketView>> TicketsAsync(int page,int pageSize,string? state,CancellationToken ct)
    {
        Validate(page,pageSize);
        if(state is not(null or "Open" or "InProgress" or "Resolved" or "Rejected")) throw new DomainException("SUPPORT_FILTER_INVALID");
        await using var db=await connections.OpenAsync(ct);
        await using var query=db.Query("""
            select id,category,title,description,lesson_version_id,state,resolution_reason,revision,created_at,updated_at
            from operations.support_tickets where cast(@state as text) is null or state=@state
            order by created_at desc,id limit @take offset @skip
            """,null,("state",state),("take",pageSize+1),("skip",(page-1)*pageSize));
        var items=new List<SupportTicketView>(); await using var reader=await query.ExecuteReaderAsync(ct);
        while(await reader.ReadAsync(ct)) items.Add(new(reader.GetGuid(0),reader.GetString(1),reader.GetString(2),reader.GetString(3),reader.IsDBNull(4)?null:reader.GetGuid(4),
            reader.GetString(5),reader.IsDBNull(6)?null:reader.GetString(6),reader.GetInt64(7),reader.GetFieldValue<DateTimeOffset>(8),reader.GetFieldValue<DateTimeOffset>(9)));
        return new(items.Take(pageSize).ToArray(),page,pageSize,items.Count>pageSize);
    }
    public async Task<AdminPage<AdminAuditView>> AuditAsync(int page,int pageSize,CancellationToken ct)
    {
        Validate(page,pageSize); await using var db=await connections.OpenAsync(ct);
        await using var query=db.Query("select id,actor_type,action,target_type,target_id,occurred_at from operations.audit_events order by occurred_at desc,id limit @take offset @skip",null,
            ("take",pageSize+1),("skip",(page-1)*pageSize));
        var items=new List<AdminAuditView>(); await using var reader=await query.ExecuteReaderAsync(ct);
        while(await reader.ReadAsync(ct)) items.Add(new(reader.GetGuid(0),reader.GetString(1),reader.GetString(2),reader.GetString(3),reader.GetString(4),reader.GetFieldValue<DateTimeOffset>(5)));
        return new(items.Take(pageSize).ToArray(),page,pageSize,items.Count>pageSize);
    }
    public async Task<AdminPage<AdminResourceView>> ResourcesAsync(string kind,int page,int pageSize,CancellationToken ct)
    {
        Validate(page,pageSize);
        var sql=kind switch
        {
            "curriculum" => "select id,title,state,version as detail from learning.course_versions order by published_at desc nulls last,id",
            "items" => "select id,family_id as title,state,part || ' · ' || tier as detail from content.question_revisions order by created_at desc,id",
            "quarantine" => "select id,family_id as title,state,part as detail from content.question_revisions where state='Quarantined' order by created_at desc,id",
            "blueprints" => "select id,version as title,state,part || ' · ' || exam_profile as detail from content.blueprint_versions order by created_at desc,id",
            "jobs" => "select id,blueprint_version as title,state,candidate_count::text || ' candidates' as detail from content.generation_jobs order by created_at desc,id",
            _ => throw new DomainException("ADMIN_RESOURCE_NOT_FOUND")
        };
        await using var db=await connections.OpenAsync(ct);
        await using var query=db.Query(sql+" limit @take offset @skip",null,("take",pageSize+1),("skip",(page-1)*pageSize));
        var items=new List<AdminResourceView>(); await using var reader=await query.ExecuteReaderAsync(ct);
        while(await reader.ReadAsync(ct)) items.Add(new(reader.GetGuid(0),reader.GetString(1),reader.GetString(2),reader.GetString(3)));
        return new(items.Take(pageSize).ToArray(),page,pageSize,items.Count>pageSize);
    }
    private static void Validate(int page,int pageSize)
    {
        if(page is <1 or >10000 || pageSize is <1 or >50) throw new DomainException("PAGINATION_INVALID");
    }
}
