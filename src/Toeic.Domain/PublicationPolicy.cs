namespace Toeic.Domain.Content;

// Pure prerequisites, NOT a publication command or proof of passed quality gates.
// Actual publication additionally requires adversarial/similarity/rights/form evidence,
// persistence, authentication and transaction handling, not yet implemented.
public static class PublicationPolicy
{
    public static string? LearnerLabel(PublicationTier tier) => tier switch
    {
        PublicationTier.BetaPractice => "Luyện tập Beta do AI hỗ trợ",
        PublicationTier.DataValidatedPractice => "Luyện tập đã kiểm định bằng dữ liệu",
        _ => null
    };

    public static void RequireSupportedTier(PublicationTier tier)
    {
        if (tier is not PublicationTier.BetaPractice and not PublicationTier.DataValidatedPractice)
            throw new DomainException("PUBLICATION_TIER_DISABLED");
    }

    public static bool HasPublicBetaRouteDiversity(ModelRoute generator, ModelRoute first, ModelRoute second)
    {
        if (!Part5Validator.ValidRoute(generator) || !Part5Validator.ValidRoute(first) || !Part5Validator.ValidRoute(second))
            return false;
        // SRS 28.8: one provider remains internal until an audited exception exists.
        var multipleProviders = new[] { generator.Provider, first.Provider, second.Provider }
            .Select(Normalize).Distinct().Count() >= 2;
        return multipleProviders && (Different(generator, first) || Different(generator, second));
    }

    private static bool Different(ModelRoute a, ModelRoute b) => Normalize(a.Provider) != Normalize(b.Provider) ||
        Normalize(a.Family) != Normalize(b.Family) || Normalize(a.Model) != Normalize(b.Model);
    private static string Normalize(string value) => value.Trim().ToUpperInvariant();
}
