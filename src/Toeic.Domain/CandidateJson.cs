using System.Text.Json;
using System.Text.Json.Serialization;

namespace Toeic.Domain.Content;

public sealed record CandidateParseResult(Part5Content? Content, ValidationReport Report);

public static class CandidateJson
{
    private static readonly JsonSerializerOptions Options = new()
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        PropertyNameCaseInsensitive = false,
        RespectNullableAnnotations = true,
        RespectRequiredConstructorParameters = true,
        AllowDuplicateProperties = false,
        MaxDepth = 16
    };

    // Provider output is untrusted. This entry point enforces DTO shape plus code
    // invariants. Provenance must subsequently be bound to server invocation data.
    public static CandidateParseResult Parse(string json, Part5Blueprint blueprint, IReadOnlySet<string> existingFamilies)
    {
        if (string.IsNullOrWhiteSpace(json) || json.Length > 32_000)
            return Invalid("JSON_SIZE_INVALID");
        try
        {
            var content = JsonSerializer.Deserialize<Part5Content>(json, Options);
            if (content is null) return Invalid("JSON_SCHEMA_INVALID");
            var report = Part5Validator.Validate(content, blueprint, existingFamilies);
            return new(report.Passed ? content : null, report);
        }
        catch (JsonException)
        {
            return Invalid("JSON_SCHEMA_INVALID");
        }
    }

    private static CandidateParseResult Invalid(string code) => new(null, new([new(code, "$")]));
}
