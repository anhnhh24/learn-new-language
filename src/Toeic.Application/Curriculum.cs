using System.Text.Json;

namespace Toeic.Application;

public sealed record CurriculumCatalogQuery(string? Search, string? Level, string? Skill);

public sealed record CourseCatalogEntry(
    Guid CourseVersionId,
    string CourseId,
    string Version,
    string Slug,
    string Title,
    string Summary,
    string Language,
    string ExamProfile,
    string Scope,
    string LevelLabel,
    string AuthorName,
    int EstimatedMinutes,
    int LessonCount,
    string AccessModel,
    string? SampleLessonCode);

public sealed record CurriculumLevelView(
    Guid Id,
    string Code,
    string Title,
    int Sequence,
    int RecommendedWeeks,
    string EntryGuidance,
    string OutcomeGuidance,
    int CheckpointQuestionCount,
    decimal CheckpointPassRate);

public sealed record CourseModuleView(
    Guid Id,
    string LevelCode,
    string Code,
    string Title,
    string Summary,
    int Sequence,
    int LessonCount);

public sealed record PublishedCourseView(
    CourseCatalogEntry Course,
    IReadOnlyList<CurriculumLevelView> Levels,
    IReadOnlyList<CourseModuleView> Modules);

public sealed record RoadmapActivityView(
    Guid Id,
    int SessionOrder,
    string ActivityType,
    string Title,
    int EstimatedMinutes,
    bool Required,
    string? LessonCode,
    string? TopicCode,
    JsonElement SchedulingPolicy);

public sealed record RoadmapWeekView(
    Guid Id,
    int WeekNumber,
    string LevelCode,
    string Title,
    string Goal,
    string? VocabularyTheme,
    string? CheckpointKind,
    decimal? PassRate,
    JsonElement RemediationRule,
    IReadOnlyList<RoadmapActivityView> Activities);

public sealed record PublishedRoadmapView(
    Guid Id,
    string CourseSlug,
    string CourseVersion,
    string Version,
    string Title,
    string AlgorithmVersion,
    int SessionMinutesMin,
    int SessionMinutesMax,
    int SessionsPerWeekMin,
    int SessionsPerWeekMax,
    decimal ReviewRatio,
    decimal LearningRatio,
    decimal BufferRatio,
    JsonElement PersonalizationPolicy,
    IReadOnlyList<RoadmapWeekView> Weeks);

public sealed record LessonBlockView(
    Guid Id,
    int Order,
    string Type,
    JsonElement Content);

public sealed record LessonPageView(
    Guid Id,
    string Title,
    int Order,
    bool Required,
    IReadOnlyList<LessonBlockView> Blocks);

public sealed record WorkedExampleView(string Sentence, string Focus);

public sealed record TopicGuideView(
    IReadOnlyList<string> FormulaPatterns,
    IReadOnlyList<string> ApplicationSteps,
    IReadOnlyList<string> Extensions,
    IReadOnlyList<string> SelfCheckPrompts);

public sealed record LessonTopicView(
    Guid Id,
    string LevelCode,
    string Code,
    string TitleVi,
    string TitleEn,
    string Category,
    string PrimaryTag,
    string Summary,
    IReadOnlyList<string> LearningObjectives,
    IReadOnlyList<string> CoreKnowledge,
    IReadOnlyList<string> CommonTraps,
    IReadOnlyList<WorkedExampleView> WorkedExamples,
    string? VocabularyTheme,
    int EstimatedMinutes,
    TopicGuideView? Guide);

public sealed record PublishedLessonView(
    Guid Id,
    Guid CourseVersionId,
    string CourseSlug,
    string CourseVersion,
    string Code,
    string Version,
    string LessonType,
    string Title,
    IReadOnlyList<string> Objectives,
    string Language,
    string LevelLabel,
    string Skill,
    IReadOnlyList<string> PrimaryTags,
    int EstimatedMinutes,
    int? QuizQuestionCount,
    decimal? RecommendedAccuracy,
    bool IsLevelCheckpoint,
    string AuthorName,
    string RightsReference,
    string AccessModel,
    bool IsSample,
    IReadOnlyList<string> PrerequisiteCodes,
    IReadOnlyList<LessonTopicView> Topics,
    IReadOnlyList<LessonPageView> Pages);

public interface ICurriculumReader
{
    Task<IReadOnlyList<CourseCatalogEntry>> ListPublishedCoursesAsync(
        CurriculumCatalogQuery query, CancellationToken cancellationToken);

    Task<PublishedCourseView?> FindPublishedCourseAsync(
        string slug, CancellationToken cancellationToken);

    Task<PublishedRoadmapView?> FindPublishedRoadmapAsync(
        string slug, CancellationToken cancellationToken);

    Task<PublishedLessonView?> FindPublishedLessonAsync(
        string courseSlug, string lessonCode, CancellationToken cancellationToken,
        Guid? requestedCourseVersionId = null);
}
