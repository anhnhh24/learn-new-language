using System.Collections.Immutable;
using System.Text;
using System.Text.RegularExpressions;

namespace Toeic.Domain.Content;

// This validator proves structural invariants only. It does not certify grammar,
// semantic similarity, ownership, or the accuracy of an AI-generated rationale.
public static partial class Part5Validator
{
    public static ValidationReport Validate(Part5Content content, Part5Blueprint blueprint,
        IReadOnlySet<string> existingFamilies)
    {
        var findings = ImmutableArray.CreateBuilder<Finding>();
        void Require(bool condition, string code, string path)
        {
            if (!condition) findings.Add(new(code, path));
        }
        Require(!string.IsNullOrWhiteSpace(blueprint.Version) &&
            !string.IsNullOrWhiteSpace(blueprint.PolicyVersion) &&
            blueprint.ExamProfile == "TOEIC-LR-R0A-v1" &&
            blueprint.MaxCandidates is > 0 and <= 10 &&
            blueprint.MaxStemLength is > 0 and <= 500 &&
            blueprint.MaxOptionLength is > 0 and <= 120 &&
            blueprint.AllowedRuleIds is { Count: > 0 }, "BLUEPRINT_INVALID", "blueprint");
        Require(ValidText(content.Stem, blueprint.MaxStemLength), "STEM_INVALID", "stem");
        Require(!string.IsNullOrEmpty(content.Stem) && Blank().Matches(content.Stem).Count == 1,
            "BLANK_COUNT", "stem");
        Require(!string.IsNullOrWhiteSpace(content.RuleId) &&
            blueprint.AllowedRuleIds?.Contains(content.RuleId) == true, "RULE_NOT_ALLOWED", "ruleId");
        Require(ValidText(content.AnswerDerivation, 4000), "DERIVATION_REQUIRED", "answerDerivation");
        Require(!string.IsNullOrWhiteSpace(content.FamilyId), "FAMILY_REQUIRED", "familyId");
        Require(!existingFamilies.Contains(content.FamilyId ?? ""), "FAMILY_COLLISION", "familyId");

        var options = content.Options.IsDefault ? [] : content.Options;
        Require(options.Length == 4, "OPTION_COUNT", "options");
        var ids = new HashSet<string>(StringComparer.Ordinal);
        var texts = new HashSet<string>(StringComparer.Ordinal);
        foreach (var option in options)
        {
            if (option is null) { findings.Add(new("OPTION_INVALID", "options")); continue; }
            Require(!string.IsNullOrWhiteSpace(option.StableId) && ids.Add(option.StableId),
                "OPTION_ID_INVALID", "options.stableId");
            Require(ValidText(option.Text, blueprint.MaxOptionLength), "OPTION_TEXT_INVALID", "options.text");
            Require(texts.Add(Normalize(option.Text)), "DUPLICATE_OPTION", "options.text");
            Require(ValidText(option.Justification, 2000), "JUSTIFICATION_REQUIRED", "options.justification");
        }
        Require(!string.IsNullOrWhiteSpace(content.ProposedKey) &&
            options.Count(o => o is not null && o.StableId == content.ProposedKey) == 1,
            "KEY_INVALID", "proposedKey");
        var source = content.Provenance;
        Require(source is not null && !string.IsNullOrWhiteSpace(source.ContributorId) &&
            !string.IsNullOrWhiteSpace(source.RightsReference) && ValidRoute(source.Generator),
            "PROVENANCE_REQUIRED", "provenance");
        Require(source?.BlueprintVersion == blueprint.Version && source?.PolicyVersion == blueprint.PolicyVersion,
            "VERSION_MISMATCH", "provenance");
        return new(findings.ToImmutable());
    }

    internal static bool ValidRoute(ModelRoute? route) => route is not null &&
        new[] { route.Provider, route.Family, route.Model, route.PromptVersion }
            .All(value => !string.IsNullOrWhiteSpace(value));

    private static bool ValidText(string? text, int max) => !string.IsNullOrWhiteSpace(text) &&
        text.Length <= max && !text.Contains('\uFFFD') && !text.Any(c => char.IsControl(c) && c is not '\n' and not '\r' and not '\t');
    private static string Normalize(string? text) => Whitespace().Replace(
        (text ?? "").Normalize(NormalizationForm.FormKC).Trim(), " ").ToUpperInvariant();
    [GeneratedRegex(@"_{3,}")] private static partial Regex Blank();
    [GeneratedRegex(@"\s+")] private static partial Regex Whitespace();
}
