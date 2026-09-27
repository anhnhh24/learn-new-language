using System.Text.Json;

namespace Toeic.Application;

public sealed record AdminExam(Guid Id, string Version, string State, string Tier, string PolicyVersion,
    string ExamProfileVersion, int DurationSeconds, int QuestionCount, DateTimeOffset CreatedAt);
public sealed record AdminExamSource(Guid Id, string FamilyId, string Part, string State, string Tier,
    string PolicyVersion, int QuestionCount);
public sealed record AdminExamContent(Guid Id, string Part, JsonElement Content);
public sealed record ExamProfileView(string Version, string Title, string Kind, bool PublicationEnabled,
    int DurationSeconds, int TotalQuestions, bool ExactStructure, JsonElement Structure);
public sealed record AdminExamDetail(AdminExam Form, IReadOnlyList<AdminExamContent> Sources);
public sealed record PublishAdminExam(Guid OperationId, string Version, string PolicyVersion,
    string ExamProfileVersion, int DurationSeconds, string Tier, Guid[] SourceIds,
    int Part5Count, int Part6Count, int Part7Count, int MaximumPriorExposure);
public sealed record ArchiveAdminExam(string ExpectedState, string Reason);
public interface IAdminExams
{
    Task<AdminPage<AdminExam>> ListAsync(int page, string? state, CancellationToken ct);
    Task<IReadOnlyList<ExamProfileView>> ProfilesAsync(CancellationToken ct);
    Task<AdminPage<AdminExamSource>> SourcesAsync(int page, string? policy, CancellationToken ct);
    Task<AdminExamContent> SourceAsync(Guid id, CancellationToken ct);
    Task<AdminExamDetail> DetailAsync(Guid id, CancellationToken ct);
    Task<Guid> PublishAsync(Guid admin, PublishAdminExam request, CancellationToken ct);
    Task ArchiveAsync(Guid admin, Guid id, ArchiveAdminExam request, CancellationToken ct);
}
