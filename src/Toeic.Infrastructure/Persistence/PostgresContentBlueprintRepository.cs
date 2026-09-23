using System.Collections.Immutable;
using System.Data.Common;
using System.Text.Json;
using Toeic.Application;
using Toeic.Domain.Content;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresContentBlueprintRepository(IPostgresSession session)
    : IContentBlueprintRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<ContentBlueprintVersion?> FindAsync(Guid id,
        CancellationToken cancellationToken)
    {
        if (id == Guid.Empty) return null;
        await using var command = CreateCommand("""
            select id, version, policy_version, exam_profile, part, state, max_candidates,
                   budget_amount, currency, definition::text, created_at, published_at
            from content.blueprint_versions
            where id = @id;
            """);
        Add(command, "@id", id);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return Map(reader);
    }

    private static ContentBlueprintVersion Map(DbDataReader reader)
    {
        var part = Enum.Parse<ToeicPart>(reader.GetString(4));
        var state = Enum.Parse<BlueprintState>(reader.GetString(5));
        var definitionJson = reader.GetString(9);
        var definition = JsonSerializer.Deserialize<BlueprintDefinitionDocument>(
            definitionJson, JsonOptions)
            ?? throw new DomainException("BLUEPRINT_DEFINITION_CORRUPT");

        var constraints = new BlueprintConstraints(
            definition.ItemType, definition.SkillId, definition.RuleId,
            definition.LexicalBand, definition.DifficultyBand,
            definition.GroupSize, definition.OptionCount, definition.StimulusType,
            definition.MinimumLength, definition.MaximumLength, definition.ScenarioId,
            [..definition.AllowedVocabulary],
            [..definition.ForbiddenTopics],
            definition.AnswerDerivation, [..definition.DistractorTypes],
            definition.EvidencePolicy, definition.MediaPolicy,
            definition.VoicePolicy, definition.ImagePolicy);

        var route = new ModelRoute(definition.GeneratorProvider, definition.GeneratorFamily,
            definition.GeneratorModel, definition.GeneratorPromptVersion);

        var budget = new BudgetLimit(reader.GetDecimal(7), reader.GetString(8));

        var createdAt = reader.GetFieldValue<DateTimeOffset>(10);
        var blueprint = new ContentBlueprintVersion(reader.GetGuid(0), reader.GetString(1),
            reader.GetString(2), reader.GetString(3), part, constraints,
            reader.GetInt32(6), budget, route, createdAt);

        // Restore persisted state without re-triggering domain validation.
        // ContentBlueprintVersion.Publish/Archive are public methods that do state checks.
        var adminActor = new Actor(ActorType.Admin, "db-reconstitute");
        if (state is BlueprintState.Published or BlueprintState.Archived)
        {
            blueprint.Publish(adminActor, TimeProvider.System);
        }
        if (state == BlueprintState.Archived)
        {
            blueprint.Archive(adminActor);
        }

        return blueprint;
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

    // JSON structure persisted in the definition column.
    private sealed record BlueprintDefinitionDocument(
        string ItemType, string SkillId, string RuleId, string LexicalBand,
        string DifficultyBand, int GroupSize, int OptionCount, string StimulusType,
        int MinimumLength, int MaximumLength, string ScenarioId,
        string[] AllowedVocabulary, string[] ForbiddenTopics,
        string AnswerDerivation, string[] DistractorTypes,
        string EvidencePolicy, string MediaPolicy, string VoicePolicy, string ImagePolicy,
        string GeneratorProvider, string GeneratorFamily,
        string GeneratorModel, string GeneratorPromptVersion);
}
