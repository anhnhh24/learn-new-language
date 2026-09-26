using Toeic.Domain.Content;

namespace Toeic.Application;

public sealed record Part7DraftQuestion(string StableId, string Prompt, IReadOnlyList<Option> Options,
    string ProposedKey, string Rationale, string EvidenceQuote);
public sealed record Part7DraftBody(string Stimulus, IReadOnlyList<Part7DraftQuestion> Questions,
    string RightsReference);
public sealed record CreatePart7Draft(Guid Id, Guid BlueprintId, Guid? PreviousRevisionId);
public sealed record SavePart7Draft(long ExpectedRevision, string Title, Part7DraftBody Body);
public sealed record Part7Draft(Guid Id, Guid BlueprintId, Guid? PreviousRevisionId, string FamilyId,
    string Title, Part7DraftBody Body, long Revision, Guid? SourceId, DateTimeOffset UpdatedAt);
public sealed record Part7DraftRow(Guid Id, string Title, int QuestionCount, long Revision,
    Guid? SourceId, DateTimeOffset UpdatedAt);
public interface IPart7Drafts
{
    Task<AdminPage<DraftBlueprint>> BlueprintsAsync(int page, CancellationToken ct);
    Task<AdminPage<Part7DraftRow>> ListAsync(int page, CancellationToken ct);
    Task<Part7Draft> GetAsync(Guid id, CancellationToken ct);
    Task<Part7Draft> CreateAsync(Guid admin, CreatePart7Draft request, CancellationToken ct);
    Task<Part7Draft> SaveAsync(Guid admin, Guid id, SavePart7Draft request, CancellationToken ct);
    Task<DraftSubmission> ValidateAsync(Guid admin, Guid id, DraftRevision request, bool submit, CancellationToken ct);
}
