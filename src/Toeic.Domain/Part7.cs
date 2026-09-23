using System.Collections.Immutable;

namespace Toeic.Domain.Content;

public sealed class StimulusVersion
{
    public Guid Id { get; }
    public string Text { get; }
    public string SourceHash { get; }

    public StimulusVersion(Guid id, string text)
    {
        if (id == Guid.Empty || string.IsNullOrWhiteSpace(text) || text.Length > 6000)
            throw new DomainException("STIMULUS_INVALID");
        Id = id;
        Text = text;
        SourceHash = ContentHash.Of(text);
    }
}

public sealed record EvidenceSpan(int Start, int Length, string Quote, string SourceHash);
public sealed record Part7Question(string StableId, string Prompt, ImmutableArray<Option> Options,
    string ProposedKey, string Rationale, ImmutableArray<EvidenceSpan> Evidence);
public sealed record Part7GroupContent(StimulusVersion Stimulus,
    ImmutableArray<Part7Question> Questions, string FamilyId, Provenance Provenance);

public static class Part7Validator
{
    public static ValidationReport Validate(Part7GroupContent group,
        ContentBlueprintVersion blueprint, IReadOnlySet<string> existingFamilies)
    {
        var findings = ImmutableArray.CreateBuilder<Finding>();
        void Require(bool condition, string code, string path)
        {
            if (!condition) findings.Add(new(code, path));
        }

        Require(blueprint.Part == ToeicPart.Part7DirectEvidence,
            "BLUEPRINT_PART_MISMATCH", "blueprint.part");
        Require(group.Stimulus is not null, "STIMULUS_REQUIRED", "stimulus");
        var questions = group.Questions.IsDefault ? [] : group.Questions;
        Require(questions.Length == blueprint.Constraints.GroupSize,
            "GROUP_SIZE_INVALID", "questions");
        Require(!string.IsNullOrWhiteSpace(group.FamilyId), "FAMILY_REQUIRED", "familyId");
        Require(!existingFamilies.Contains(group.FamilyId ?? string.Empty),
            "FAMILY_COLLISION", "familyId");
        Require(group.Provenance is not null &&
                group.Provenance.BlueprintVersion == blueprint.Version &&
                group.Provenance.PolicyVersion == blueprint.PolicyVersion &&
                !string.IsNullOrWhiteSpace(group.Provenance.RightsReference),
            "PROVENANCE_REQUIRED", "provenance");

        var questionIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var question in questions)
        {
            if (question is null)
            {
                findings.Add(new("QUESTION_INVALID", "questions"));
                continue;
            }

            Require(!string.IsNullOrWhiteSpace(question.StableId) && questionIds.Add(question.StableId),
                "QUESTION_ID_INVALID", "questions.stableId");
            Require(!string.IsNullOrWhiteSpace(question.Prompt) && question.Prompt.Length <= 1000,
                "QUESTION_PROMPT_INVALID", $"questions.{question.StableId}.prompt");
            Require(!string.IsNullOrWhiteSpace(question.Rationale),
                "RATIONALE_REQUIRED", $"questions.{question.StableId}.rationale");
            ValidateOptions(question, blueprint, findings);
            ValidateEvidence(question, group.Stimulus, findings);
        }

        return new(findings.ToImmutable());
    }

    private static void ValidateOptions(Part7Question question, ContentBlueprintVersion blueprint,
        ImmutableArray<Finding>.Builder findings)
    {
        var options = question.Options.IsDefault ? [] : question.Options;
        if (options.Length != blueprint.Constraints.OptionCount)
            findings.Add(new("OPTION_COUNT", $"questions.{question.StableId}.options"));

        var ids = new HashSet<string>(StringComparer.Ordinal);
        var texts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var option in options)
        {
            if (option is null || string.IsNullOrWhiteSpace(option.StableId) ||
                !ids.Add(option.StableId) || string.IsNullOrWhiteSpace(option.Text) ||
                !texts.Add(option.Text.Trim()) || string.IsNullOrWhiteSpace(option.Justification))
                findings.Add(new("OPTION_INVALID", $"questions.{question.StableId}.options"));
        }

        if (string.IsNullOrWhiteSpace(question.ProposedKey) ||
            options.Count(option => option is not null && option.StableId == question.ProposedKey) != 1)
            findings.Add(new("KEY_INVALID", $"questions.{question.StableId}.proposedKey"));
    }

    private static void ValidateEvidence(Part7Question question, StimulusVersion? stimulus,
        ImmutableArray<Finding>.Builder findings)
    {
        var evidence = question.Evidence.IsDefault ? [] : question.Evidence;
        if (evidence.Length == 0)
        {
            findings.Add(new("EVIDENCE_REQUIRED", $"questions.{question.StableId}.evidence"));
            return;
        }
        if (stimulus is null) return;

        foreach (var span in evidence)
        {
            if (span is null || span.Start < 0 || span.Length <= 0 ||
                span.Start > stimulus.Text.Length - span.Length)
            {
                findings.Add(new("EVIDENCE_OFFSET_INVALID", $"questions.{question.StableId}.evidence"));
                continue;
            }

            if (span.SourceHash != stimulus.SourceHash ||
                !string.Equals(stimulus.Text.Substring(span.Start, span.Length), span.Quote,
                    StringComparison.Ordinal))
                findings.Add(new("EVIDENCE_SOURCE_MISMATCH", $"questions.{question.StableId}.evidence"));
        }
    }
}
