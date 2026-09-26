using Toeic.Domain.Content;

namespace Toeic.Application;

public sealed record DraftBlueprint(Guid Id, string Version, string PolicyVersion, string RuleId);
public sealed record Part5DraftBody(string Stem, IReadOnlyList<Option> Options, string ProposedKey, string AnswerDerivation, string RightsReference);
public sealed record CreateQuestionDraft(Guid Id, Guid BlueprintId, Guid? PreviousRevisionId);
public sealed record SaveQuestionDraft(long ExpectedRevision, string Title, Part5DraftBody Body);
public sealed record DraftRevision(long ExpectedRevision);
public sealed record QuestionDraft(Guid Id, Guid BlueprintId, Guid? PreviousRevisionId, string FamilyId,
    string Title, Part5DraftBody Body, long Revision, Guid? SourceId, DateTimeOffset UpdatedAt);
public sealed record QuestionDraftRow(Guid Id, string Title, long Revision, Guid? SourceId, DateTimeOffset UpdatedAt);
public sealed record DraftSubmission(Guid? SourceId, ValidationReport Report);
public interface IQuestionDrafts
{
    Task<AdminPage<DraftBlueprint>> BlueprintsAsync(int page, CancellationToken ct);
    Task<AdminPage<QuestionDraftRow>> ListAsync(int page, CancellationToken ct);
    Task<QuestionDraft> GetAsync(Guid id, CancellationToken ct);
    Task<QuestionDraft> CreateAsync(Guid admin, CreateQuestionDraft request, CancellationToken ct);
    Task<QuestionDraft> SaveAsync(Guid admin, Guid id, SaveQuestionDraft request, CancellationToken ct);
    Task<DraftSubmission> ValidateAsync(Guid admin, Guid id, DraftRevision request, bool submit, CancellationToken ct);
}
