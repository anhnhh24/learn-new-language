using System.Collections.Immutable;
using System.Text.Json;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Toeic.Domain.Content;

namespace Toeic.Domain.Tests;

[TestClass]
public class QualityTests
{
    private static readonly Actor Worker = new(ActorType.SystemWorker, "worker-1");
    private static readonly Actor Admin = new(ActorType.Admin, "admin-1");
    private static readonly ModelRoute Generator = new("provider-a", "family-a", "model-a", "prompt-v1");
    private static readonly ModelRoute OtherRoute = new("provider-b", "family-b", "model-b", "solver-v1");
    private static readonly Part5Blueprint Blueprint = new("bp-v1", "policy-v1", "TOEIC-LR-R0A-v1",
        ImmutableHashSet.Create("subject-verb-agreement"));
    private static readonly TimeProvider Clock = new FixedClock();
    private static readonly HashSet<string> EmptyBank = [];

    private static Part5Content Valid() => new(
        "The manager ___ the report every Monday.",
        [new("present", "reviews", "Singular subject requires the present singular form."),
         new("plural", "review", "This form does not agree with the singular subject."),
         new("progressive", "reviewing", "A participle requires an auxiliary verb here."),
         new("past", "reviewed", "The routine is expressed in the present in this fixture.")],
        "present", "subject-verb-agreement", "Match the singular subject with the present verb.",
        "fixture-family-1", new("synthetic-test-only", "bp-v1", "policy-v1", "test-fixture-only", Generator));

    private static CandidateRevision Structured()
    {
        var candidate = new CandidateRevision(Valid());
        Assert.IsTrue(candidate.ValidateStructure(Blueprint, EmptyBank, Worker, Clock).Passed);
        return candidate;
    }

    private static SolverVote Vote(CandidateRevision candidate, string key = "present") => new(
        Guid.NewGuid(), candidate.Id, ContentHash.Of(candidate.CreateBlindInput()), "policy-v1", OtherRoute, key, false);

    private static void HasFinding(Part5Content content, string code)
    {
        var report = Part5Validator.Validate(content, Blueprint, EmptyBank);
        Assert.IsFalse(report.Passed);
        Assert.IsTrue(report.Findings.Any(f => f.Code == code), code);
    }

    [TestMethod] public void Valid_structure_advances_with_revision_bound_audit()
    {
        var candidate = Structured();
        Assert.AreEqual(CandidateState.StructuralValid, candidate.State);
        Assert.AreEqual(PublicationTier.Draft, candidate.Tier);
        var entry = candidate.History.Single();
        Assert.AreEqual(candidate.Id, entry.CandidateRevision);
        Assert.AreEqual("policy-v1", entry.PolicyVersion);
        Assert.AreEqual(Clock.GetUtcNow(), entry.At);
        Assert.AreEqual(Worker, entry.Actor);
    }

    [TestMethod] public void Five_options_are_rejected_TC73() => HasFinding(
        Valid() with { Options = Valid().Options.Add(new("fifth", "has reviewed", "Extra option")) }, "OPTION_COUNT");

    [TestMethod] public void Duplicate_key_ids_are_rejected_TC73() => HasFinding(
        Valid() with { Options = Valid().Options.SetItem(1, Valid().Options[1] with { StableId = "present" }) }, "KEY_INVALID");

    [TestMethod] public void Unicode_and_whitespace_normalized_duplicate_options_are_rejected() => HasFinding(
        Valid() with { Options = Valid().Options.SetItem(1, Valid().Options[1] with { Text = "  ＲＥＶＩＥＷＳ  " }) }, "DUPLICATE_OPTION");

    [TestMethod] public void Missing_key_is_rejected() => HasFinding(Valid() with { ProposedKey = "unknown" }, "KEY_INVALID");
    [TestMethod] public void Missing_derivation_is_rejected() => HasFinding(Valid() with { AnswerDerivation = " " }, "DERIVATION_REQUIRED");
    [TestMethod] public void Unknown_rule_is_rejected() => HasFinding(Valid() with { RuleId = "unknown" }, "RULE_NOT_ALLOWED");
    [TestMethod] public void Missing_blank_is_rejected() => HasFinding(Valid() with { Stem = "No blank here." }, "BLANK_COUNT");
    [TestMethod] public void Multiple_blanks_are_rejected() => HasFinding(Valid() with { Stem = "The ___ manager ___." }, "BLANK_COUNT");
    [TestMethod] public void Default_options_are_rejected() => HasFinding(Valid() with { Options = default }, "OPTION_COUNT");
    [TestMethod] public void Null_option_is_rejected() => HasFinding(Valid() with { Options = Valid().Options.SetItem(0, null!) }, "OPTION_INVALID");
    [TestMethod] public void Missing_justification_is_rejected() => HasFinding(
        Valid() with { Options = Valid().Options.SetItem(1, Valid().Options[1] with { Justification = "" }) }, "JUSTIFICATION_REQUIRED");
    [TestMethod] public void Missing_rights_reference_is_rejected() => HasFinding(
        Valid() with { Provenance = Valid().Provenance with { RightsReference = "" } }, "PROVENANCE_REQUIRED");
    [TestMethod] public void Stale_policy_is_rejected() => HasFinding(
        Valid() with { Provenance = Valid().Provenance with { PolicyVersion = "policy-old" } }, "VERSION_MISMATCH");

    [TestMethod] public void Family_collision_is_rejected()
    {
        var report = Part5Validator.Validate(Valid(), Blueprint, new HashSet<string> { "fixture-family-1" });
        Assert.IsTrue(report.Findings.Any(f => f.Code == "FAMILY_COLLISION"));
    }

    [TestMethod] public void Blueprint_over_quota_is_rejected()
    {
        Assert.IsFalse(Part5Validator.Validate(Valid(), Blueprint with { MaxCandidates = 11 }, EmptyBank).Passed);
    }

    [TestMethod] public void Structural_failure_is_terminal_and_cannot_be_revalidated()
    {
        var candidate = new CandidateRevision(Valid() with { ProposedKey = "wrong" });
        candidate.ValidateStructure(Blueprint, EmptyBank, Worker, Clock);
        Assert.AreEqual(CandidateState.Rejected, candidate.State);
        Assert.ThrowsException<DomainException>(() => candidate.ValidateStructure(Blueprint, EmptyBank, Worker, Clock));
        Assert.AreEqual(1, candidate.History.Count);
    }

    [TestMethod] public void Blind_payload_has_no_key_rationale_or_provenance_TC76()
    {
        using var json = JsonDocument.Parse(JsonSerializer.Serialize(Structured().CreateBlindInput()));
        CollectionAssert.AreEquivalent(new[] { "RevisionId", "Stem", "Options" },
            json.RootElement.EnumerateObject().Select(p => p.Name).ToArray());
        CollectionAssert.AreEquivalent(new[] { "StableId", "Text" },
            json.RootElement.GetProperty("Options")[0].EnumerateObject().Select(p => p.Name).ToArray());
    }

    [TestMethod] public void Two_matching_votes_advance_but_do_not_publish()
    {
        var candidate = Structured();
        Assert.IsTrue(candidate.ValidateConsensus(Vote(candidate), Vote(candidate), Worker, Clock).Passed);
        Assert.AreEqual(CandidateState.CrossModelValid, candidate.State);
        Assert.IsNull(PublicationPolicy.LearnerLabel(candidate.Tier));
    }

    [TestMethod] public void No_majority_override_TC75()
    {
        var candidate = Structured();
        Assert.IsFalse(candidate.ValidateConsensus(Vote(candidate), Vote(candidate, "plural"), Worker, Clock).Passed);
        Assert.AreEqual(CandidateState.Rejected, candidate.State);
    }

    [TestMethod] public void Reusing_same_invocation_is_rejected()
    {
        var candidate = Structured();
        var vote = Vote(candidate);
        Assert.IsFalse(candidate.ValidateConsensus(vote, vote, Worker, Clock).Passed);
    }

    [TestMethod] public void Vote_bound_to_different_revision_is_rejected()
    {
        var candidate = Structured();
        Assert.IsFalse(candidate.ValidateConsensus(Vote(candidate), Vote(candidate) with { RevisionId = Guid.NewGuid() }, Worker, Clock).Passed);
    }

    [TestMethod] public void Leaked_or_changed_input_hash_is_rejected()
    {
        var candidate = Structured();
        Assert.IsFalse(candidate.ValidateConsensus(Vote(candidate), Vote(candidate) with { InputHash = "different-context" }, Worker, Clock).Passed);
    }

    [TestMethod] public void Ambiguity_is_rejected()
    {
        var candidate = Structured();
        Assert.IsFalse(candidate.ValidateConsensus(Vote(candidate), Vote(candidate) with { Ambiguous = true }, Worker, Clock).Passed);
    }

    [TestMethod] public void Stale_solver_policy_is_rejected()
    {
        var candidate = Structured();
        Assert.IsFalse(candidate.ValidateConsensus(Vote(candidate), Vote(candidate) with { PolicyVersion = "old" }, Worker, Clock).Passed);
    }

    [TestMethod] public void Cannot_skip_structure()
    {
        Assert.ThrowsException<DomainException>(() => new CandidateRevision(Valid()).CreateBlindInput());
    }

    [TestMethod] public void Admin_cannot_impersonate_validation_worker()
    {
        var candidate = new CandidateRevision(Valid());
        Assert.ThrowsException<DomainException>(() => candidate.ValidateStructure(Blueprint, EmptyBank, Admin, Clock));
        Assert.AreEqual(CandidateState.Generated, candidate.State);
        Assert.AreEqual(0, candidate.History.Count);
    }

    [TestMethod] public void Quarantine_requires_permission_and_reason()
    {
        var candidate = Structured();
        Assert.ThrowsException<DomainException>(() => candidate.Quarantine("reported", new(ActorType.Learner, "learner"), Clock));
        Assert.ThrowsException<DomainException>(() => candidate.Quarantine(" ", Admin, Clock));
        candidate.Quarantine("QUALITY_REGRESSION", Admin, Clock);
        Assert.AreEqual(CandidateState.Quarantined, candidate.State);
        Assert.ThrowsException<DomainException>(() => candidate.CreateBlindInput());
    }

    [TestMethod] public void Revision_does_not_inherit_state_history_or_hash()
    {
        var original = Structured();
        var originalHash = original.ContentHash;
        var edited = original.Revise(Valid() with { Stem = "The director ___ the report every Monday." }, Admin);
        Assert.AreEqual(original.Id, edited.PreviousRevisionId);
        Assert.AreNotEqual(original.Id, edited.Id);
        Assert.AreNotEqual(originalHash, edited.ContentHash);
        Assert.AreEqual(originalHash, original.ContentHash);
        Assert.AreEqual(CandidateState.Generated, edited.State);
        Assert.AreEqual(0, edited.History.Count);
        Assert.AreEqual(CandidateState.StructuralValid, original.State);
    }

    [DataTestMethod]
    [DataRow(PublicationTier.ExpertReviewed)]
    [DataRow(PublicationTier.CalibratedMock)]
    [DataRow(PublicationTier.Draft)]
    [DataRow(PublicationTier.AutoValidated)]
    [DataRow((PublicationTier)999)]
    public void Unsupported_tiers_fail_closed_TC79(PublicationTier tier)
    {
        Assert.ThrowsException<DomainException>(() => PublicationPolicy.RequireSupportedTier(tier));
        Assert.IsNull(PublicationPolicy.LearnerLabel(tier));
    }

    [TestMethod] public void Beta_label_is_truthful_TC80()
    {
        Assert.AreEqual("Luyện tập Beta do AI hỗ trợ", PublicationPolicy.LearnerLabel(PublicationTier.BetaPractice));
        Assert.AreEqual("Luyện tập đã kiểm định bằng dữ liệu", PublicationPolicy.LearnerLabel(PublicationTier.DataValidatedPractice));
    }

    [TestMethod] public void Single_provider_routes_cannot_qualify_for_public_beta()
    {
        Assert.IsFalse(PublicationPolicy.HasPublicBetaRouteDiversity(Generator, Generator,
            OtherRoute with { Provider = " PROVIDER-A " }));
        Assert.IsTrue(PublicationPolicy.HasPublicBetaRouteDiversity(Generator, Generator, OtherRoute));
    }

    [TestMethod] public void Valid_json_round_trips_through_structural_validation()
    {
        var parsed = CandidateJson.Parse(JsonSerializer.Serialize(Valid()), Blueprint, EmptyBank);
        Assert.IsTrue(parsed.Report.Passed);
        Assert.AreEqual(Valid().Stem, parsed.Content!.Stem);
    }

    [DataTestMethod]
    [DataRow("{}")]
    [DataRow("null")]
    [DataRow("[]")]
    [DataRow("not-json")]
    public void Malformed_or_missing_json_fields_fail_closed(string json)
    {
        var parsed = CandidateJson.Parse(json, Blueprint, EmptyBank);
        Assert.IsFalse(parsed.Report.Passed);
        Assert.IsNull(parsed.Content);
    }

    [TestMethod] public void Client_cannot_inject_tier_or_passed_flag()
    {
        var json = JsonSerializer.Serialize(Valid());
        var parsed = CandidateJson.Parse(json[..^1] + ",\"GatePassed\":true}", Blueprint, EmptyBank);
        Assert.IsFalse(parsed.Report.Passed);
        Assert.IsNull(parsed.Content);
    }

    [TestMethod] public void Explicit_null_provenance_is_rejected()
    {
        var parsed = CandidateJson.Parse(JsonSerializer.Serialize(Valid() with { Provenance = null! }), Blueprint, EmptyBank);
        Assert.IsFalse(parsed.Report.Passed);
        Assert.IsNull(parsed.Content);
    }

    [TestMethod] public void Invalid_candidate_json_never_returns_usable_content()
    {
        var parsed = CandidateJson.Parse(JsonSerializer.Serialize(Valid() with { ProposedKey = "wrong" }), Blueprint, EmptyBank);
        Assert.IsFalse(parsed.Report.Passed);
        Assert.IsNull(parsed.Content);
    }

    [TestMethod] public void Oversized_json_is_rejected_before_parsing()
    {
        var parsed = CandidateJson.Parse(new string(' ', 32_001), Blueprint, EmptyBank);
        Assert.AreEqual("JSON_SIZE_INVALID", parsed.Report.Findings.Single().Code);
    }
    [TestMethod] public void Duplicate_json_key_is_rejected()
    {
        var json = JsonSerializer.Serialize(Valid());
        var parsed = CandidateJson.Parse(json[..^1] + ",\"ProposedKey\":\"plural\"}", Blueprint, EmptyBank);
        Assert.IsFalse(parsed.Report.Passed);
        Assert.IsNull(parsed.Content);
        Assert.AreEqual("JSON_SCHEMA_INVALID", parsed.Report.Findings.Single().Code);
    }
    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 9, 23, 0, 0, 0, TimeSpan.Zero);
    }
}
