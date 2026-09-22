using System.Collections.Immutable;

namespace Toeic.Domain.Content;

public enum ToeicPart { Part5, Part7DirectEvidence }
public enum BlueprintState { Draft, Published, Archived }

public sealed record BudgetLimit(decimal Amount, string Currency)
{
    public BudgetLimit Validate()
    {
        if (Amount <= 0 || Amount != decimal.Round(Amount, 6))
            throw new DomainException("BLUEPRINT_BUDGET_INVALID");
        if (string.IsNullOrWhiteSpace(Currency) || Currency.Length != 3 ||
            Currency.Any(character => !char.IsAsciiLetterUpper(character)))
            throw new DomainException("BLUEPRINT_CURRENCY_INVALID");
        return this;
    }
}

public sealed record BlueprintConstraints(
    string ItemType, string SkillId, string RuleId, string LexicalBand, string DifficultyBand,
    int GroupSize, int OptionCount, string StimulusType, int MinimumLength, int MaximumLength,
    string ScenarioId, ImmutableArray<string> AllowedVocabulary, ImmutableArray<string> ForbiddenTopics,
    string AnswerDerivation, ImmutableArray<string> DistractorTypes, string EvidencePolicy,
    string MediaPolicy, string VoicePolicy, string ImagePolicy);

public sealed class ContentBlueprintVersion
{
    public Guid Id { get; }
    public string Version { get; }
    public string PolicyVersion { get; }
    public string ExamProfile { get; }
    public ToeicPart Part { get; }
    public BlueprintConstraints Constraints { get; }
    public int MaxCandidates { get; }
    public BudgetLimit Budget { get; }
    public ModelRoute GeneratorRoute { get; }
    public BlueprintState State { get; private set; } = BlueprintState.Draft;
    public DateTimeOffset CreatedAt { get; }
    public DateTimeOffset? PublishedAt { get; private set; }

    public ContentBlueprintVersion(Guid id, string version, string policyVersion, string examProfile,
        ToeicPart part, BlueprintConstraints constraints, int maxCandidates, BudgetLimit budget,
        ModelRoute generatorRoute, DateTimeOffset createdAt)
    {
        if (id == Guid.Empty) throw new DomainException("BLUEPRINT_ID_REQUIRED");
        RequireText(version, "BLUEPRINT_VERSION_REQUIRED");
        RequireText(policyVersion, "POLICY_VERSION_REQUIRED");
        RequireText(examProfile, "EXAM_PROFILE_REQUIRED");
        ArgumentNullException.ThrowIfNull(constraints);
        ArgumentNullException.ThrowIfNull(budget);
        if (!Part5Validator.ValidRoute(generatorRoute)) throw new DomainException("GENERATOR_ROUTE_INVALID");
        var maximumJobSize = part == ToeicPart.Part5 ? 10 : 3;
        if (maxCandidates < 1 || maxCandidates > maximumJobSize)
            throw new DomainException("BLUEPRINT_QUOTA_INVALID");
        ValidateConstraints(part, constraints);

        Id = id;
        Version = version.Trim();
        PolicyVersion = policyVersion.Trim();
        ExamProfile = examProfile.Trim();
        Part = part;
        Constraints = Normalize(constraints);
        MaxCandidates = maxCandidates;
        Budget = budget.Validate();
        GeneratorRoute = generatorRoute;
        CreatedAt = createdAt;
    }

    public void Publish(Actor actor, TimeProvider clock)
    {
        RequireAdmin(actor);
        if (State != BlueprintState.Draft) throw new DomainException("BLUEPRINT_NOT_DRAFT");
        State = BlueprintState.Published;
        PublishedAt = clock.GetUtcNow();
    }

    public void Archive(Actor actor)
    {
        RequireAdmin(actor);
        if (State != BlueprintState.Published) throw new DomainException("BLUEPRINT_NOT_PUBLISHED");
        State = BlueprintState.Archived;
    }

    public void RequireUsableForGeneration()
    {
        if (State != BlueprintState.Published) throw new DomainException("BLUEPRINT_NOT_PUBLISHED");
    }

    public decimal RequiredReservation(int candidateCount)
    {
        if (candidateCount is < 1 || candidateCount > MaxCandidates)
            throw new DomainException("JOB_QUOTA_INVALID");
        return decimal.Round(Budget.Amount * candidateCount / MaxCandidates, 6, MidpointRounding.AwayFromZero);
    }

    public Part5Blueprint ToPart5Blueprint()
    {
        if (Part != ToeicPart.Part5) throw new DomainException("BLUEPRINT_PART_MISMATCH");
        return new(Version, PolicyVersion, ExamProfile,
            ImmutableHashSet.Create(StringComparer.Ordinal, Constraints.RuleId),
            MaxCandidates, Constraints.MaximumLength, 120);
    }

    private static void ValidateConstraints(ToeicPart part, BlueprintConstraints constraints)
    {
        foreach (var value in new[] { constraints.ItemType, constraints.SkillId, constraints.RuleId,
                     constraints.LexicalBand, constraints.DifficultyBand, constraints.StimulusType,
                     constraints.ScenarioId, constraints.AnswerDerivation, constraints.EvidencePolicy,
                     constraints.MediaPolicy, constraints.VoicePolicy, constraints.ImagePolicy })
            RequireText(value, "BLUEPRINT_CONSTRAINT_REQUIRED");

        if (constraints.MinimumLength < 1 || constraints.MaximumLength < constraints.MinimumLength)
            throw new DomainException("BLUEPRINT_LENGTH_INVALID");
        if (constraints.DistractorTypes.IsDefaultOrEmpty || HasBlankOrDuplicate(constraints.DistractorTypes))
            throw new DomainException("DISTRACTOR_POLICY_INVALID");
        if (constraints.AllowedVocabulary.IsDefault || constraints.ForbiddenTopics.IsDefault ||
            HasBlankOrDuplicate(constraints.AllowedVocabulary) || HasBlankOrDuplicate(constraints.ForbiddenTopics))
            throw new DomainException("VOCABULARY_POLICY_INVALID");
        if (part == ToeicPart.Part5 && (constraints.GroupSize != 1 || constraints.OptionCount != 4))
            throw new DomainException("PART5_PROFILE_INVALID");
        if (part == ToeicPart.Part7DirectEvidence &&
            (constraints.GroupSize is < 2 or > 5 || constraints.OptionCount != 4))
            throw new DomainException("PART7_PROFILE_INVALID");
    }

    private static BlueprintConstraints Normalize(BlueprintConstraints constraints) => constraints with
    {
        AllowedVocabulary = NormalizeList(constraints.AllowedVocabulary),
        ForbiddenTopics = NormalizeList(constraints.ForbiddenTopics),
        DistractorTypes = NormalizeList(constraints.DistractorTypes)
    };

    private static ImmutableArray<string> NormalizeList(ImmutableArray<string> values) =>
        values.Select(value => value.Trim()).ToImmutableArray();

    private static bool HasBlankOrDuplicate(ImmutableArray<string> values) =>
        values.Any(string.IsNullOrWhiteSpace) ||
        values.Select(value => value.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() != values.Length;

    private static void RequireText(string? value, string code)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new DomainException(code);
    }

    private static void RequireAdmin(Actor actor)
    {
        if (actor is null || actor.Type != ActorType.Admin || string.IsNullOrWhiteSpace(actor.Id))
            throw new DomainException("FORBIDDEN");
    }
}
