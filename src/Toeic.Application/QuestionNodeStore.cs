namespace Toeic.Application;

public sealed record QuestionNodeDefinition(Guid Id, string StableId, int Order);

public interface IQuestionNodeStore
{
    Task AddAsync(Guid sourceRevisionId, IReadOnlyCollection<QuestionNodeDefinition> questions,
        CancellationToken cancellationToken);
}
