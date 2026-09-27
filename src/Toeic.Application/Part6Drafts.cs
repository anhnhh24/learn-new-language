using Toeic.Domain.Content;
namespace Toeic.Application;
public sealed record Part6DraftQuestion(string StableId,string Prompt,IReadOnlyList<Option> Options,string ProposedKey,string Rationale);
public sealed record Part6DraftBody(string Stimulus,IReadOnlyList<Part6DraftQuestion> Questions,string RightsReference);
public sealed record CreatePart6Draft(Guid Id,Guid BlueprintId,Guid? PreviousRevisionId);
public sealed record SavePart6Draft(long ExpectedRevision,string Title,Part6DraftBody Body);
public sealed record Part6Draft(Guid Id,Guid BlueprintId,Guid? PreviousRevisionId,string FamilyId,string Title,Part6DraftBody Body,long Revision,Guid? SourceId,DateTimeOffset UpdatedAt);
public sealed record Part6DraftRow(Guid Id,string Title,int QuestionCount,long Revision,Guid? SourceId,DateTimeOffset UpdatedAt);
public interface IPart6Drafts
{
 Task<AdminPage<DraftBlueprint>> BlueprintsAsync(int page,CancellationToken ct); Task<AdminPage<Part6DraftRow>> ListAsync(int page,CancellationToken ct); Task<Part6Draft> GetAsync(Guid id,CancellationToken ct); Task<Part6Draft> CreateAsync(Guid admin,CreatePart6Draft request,CancellationToken ct); Task<Part6Draft> SaveAsync(Guid admin,Guid id,SavePart6Draft request,CancellationToken ct); Task<DraftSubmission> ValidateAsync(Guid admin,Guid id,DraftRevision request,bool submit,CancellationToken ct);
}
