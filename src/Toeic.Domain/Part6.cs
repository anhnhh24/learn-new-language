using System.Collections.Immutable;

namespace Toeic.Domain.Content;

public sealed record Part6Question(string StableId, string Prompt, ImmutableArray<Option> Options,
    string ProposedKey, string Rationale);
public sealed record Part6GroupContent(StimulusVersion Stimulus,
    ImmutableArray<Part6Question> Questions, string FamilyId, Provenance Provenance);

public static class Part6Validator
{
    public static ValidationReport Validate(Part6GroupContent group, ContentBlueprintVersion blueprint,
        IReadOnlySet<string> existingFamilies)
    {
        var findings=ImmutableArray.CreateBuilder<Finding>();
        void Require(bool value,string code,string path) { if(!value) findings.Add(new(code,path)); }
        Require(blueprint.Part==ToeicPart.Part6,"BLUEPRINT_PART_MISMATCH","blueprint.part");
        Require(group.Stimulus is not null,"STIMULUS_REQUIRED","stimulus");
        var questions=group.Questions.IsDefault?[]:group.Questions;
        Require(questions.Length==blueprint.Constraints.GroupSize,"GROUP_SIZE_INVALID","questions");
        Require(!string.IsNullOrWhiteSpace(group.FamilyId),"FAMILY_REQUIRED","familyId");
        Require(!existingFamilies.Contains(group.FamilyId??""),"FAMILY_COLLISION","familyId");
        Require(group.Provenance is not null&&group.Provenance.BlueprintVersion==blueprint.Version&&group.Provenance.PolicyVersion==blueprint.PolicyVersion&&!string.IsNullOrWhiteSpace(group.Provenance.RightsReference),"PROVENANCE_REQUIRED","provenance");
        var questionIds=new HashSet<string>(StringComparer.Ordinal);
        foreach(var question in questions)
        {
            if(question is null) { findings.Add(new("QUESTION_INVALID","questions")); continue; }
            Require(!string.IsNullOrWhiteSpace(question.StableId)&&questionIds.Add(question.StableId),"QUESTION_ID_INVALID","questions.stableId");
            Require(!string.IsNullOrWhiteSpace(question.Prompt)&&question.Prompt.Length<=1000,"QUESTION_PROMPT_INVALID",$"questions.{question.StableId}.prompt");
            Require(!string.IsNullOrWhiteSpace(question.Rationale),"RATIONALE_REQUIRED",$"questions.{question.StableId}.rationale");
            var options=question.Options.IsDefault?[]:question.Options;
            Require(options.Length==blueprint.Constraints.OptionCount,"OPTION_COUNT",$"questions.{question.StableId}.options");
            var ids=new HashSet<string>(StringComparer.Ordinal); var texts=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach(var option in options) Require(option is not null&&!string.IsNullOrWhiteSpace(option.StableId)&&ids.Add(option.StableId)&&!string.IsNullOrWhiteSpace(option.Text)&&texts.Add(option.Text.Trim())&&!string.IsNullOrWhiteSpace(option.Justification),"OPTION_INVALID",$"questions.{question.StableId}.options");
            Require(!string.IsNullOrWhiteSpace(question.ProposedKey)&&options.Count(option=>option is not null&&option.StableId==question.ProposedKey)==1,"KEY_INVALID",$"questions.{question.StableId}.proposedKey");
        }
        return new(findings.ToImmutable());
    }
}
