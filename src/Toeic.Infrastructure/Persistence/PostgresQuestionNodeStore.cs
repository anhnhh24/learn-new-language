using System.Data.Common;
using Npgsql;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresQuestionNodeStore(IPostgresSession session) : IQuestionNodeStore
{
    public async Task AddAsync(Guid sourceRevisionId,
        IReadOnlyCollection<QuestionNodeDefinition> questions,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(questions);
        var ordered = questions.OrderBy(question => question.Order).ToArray();
        if (sourceRevisionId == Guid.Empty || questions.Count == 0 ||
            questions.Any(question => question.Id == Guid.Empty ||
                string.IsNullOrWhiteSpace(question.StableId) ||
                question.StableId.Trim().Length > 200 || question.Order <= 0) ||
            questions.Select(question => question.Id).Distinct().Count() != questions.Count ||
            questions.Select(question => question.StableId.Trim())
                .Distinct(StringComparer.Ordinal).Count() != questions.Count ||
            !ordered.Select(question => question.Order)
                .SequenceEqual(Enumerable.Range(1, questions.Count)))
            throw new DomainException("QUESTION_NODES_INVALID");

        foreach (var question in ordered)
        {
            await using var command = CreateCommand("""
                insert into content.question_nodes
                    (id, source_revision_id, stable_id, question_order)
                values (@id, @source_revision_id, @stable_id, @question_order);
                """);
            Add(command, "@id", question.Id);
            Add(command, "@source_revision_id", sourceRevisionId);
            Add(command, "@stable_id", question.StableId.Trim());
            Add(command, "@question_order", question.Order);
            try
            {
                await command.ExecuteNonQueryAsync(cancellationToken);
            }
            catch (PostgresException exception)
                when (exception.SqlState is PostgresErrorCodes.UniqueViolation or
                    PostgresErrorCodes.ForeignKeyViolation)
            {
                throw new DomainException("QUESTION_NODES_CONFLICT");
            }
        }
    }

    private DbCommand CreateCommand(string sql)
    {
        var command = session.Connection.CreateCommand();
        command.Transaction = session.Transaction;
        command.CommandText = sql;
        return command;
    }

    private static void Add(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
