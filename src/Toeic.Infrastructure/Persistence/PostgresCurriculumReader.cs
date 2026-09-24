using System.Data.Common;
using System.Globalization;
using System.Text;
using System.Text.Json;
using Toeic.Application;

namespace Toeic.Infrastructure.Persistence;

internal sealed class PostgresCurriculumReader(IDbConnectionFactory connections)
    : ICurriculumReader
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<CourseCatalogEntry>> ListPublishedCoursesAsync(
        CurriculumCatalogQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        await using var connection = await connections.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select cv.id, cv.course_id::text, cv.version, cv.slug, cv.title, cv.summary,
                   cv.language, cv.exam_profile, cv.scope, cv.level_label, cv.author_name,
                   cv.estimated_minutes, count(lv.id)::int, cv.access_model,
                   min(lv.code) filter (where lv.is_sample)
            from learning.course_versions cv
            left join learning.lesson_versions lv
              on lv.course_version_id = cv.id and lv.state = 'Published'
            where cv.state = 'Published'
            group by cv.id
            order by cv.published_at desc, cv.title;
            """;

        var courses = new List<CourseCatalogEntry>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            courses.Add(MapCourse(reader));

        var search = Normalize(query.Search);
        var level = Normalize(query.Level);
        var skill = Normalize(query.Skill);
        return courses.Where(course =>
                (search.Length == 0 ||
                 Normalize(course.Title).Contains(search, StringComparison.Ordinal) ||
                 Normalize(course.Summary).Contains(search, StringComparison.Ordinal)) &&
                (level.Length == 0 ||
                 Normalize(course.LevelLabel).Contains(level, StringComparison.Ordinal)) &&
                (skill.Length == 0 ||
                 Normalize(course.Scope).Contains(skill, StringComparison.Ordinal)))
            .ToArray();
    }

    public async Task<PublishedCourseView?> FindPublishedCourseAsync(
        string slug, CancellationToken cancellationToken)
    {
        if (!IsSafeCode(slug)) return null;
        await using var connection = await connections.OpenAsync(cancellationToken);
        var course = await FindCourseAsync(connection, slug, cancellationToken);
        if (course is null) return null;

        var levels = new List<CurriculumLevelView>();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                select cl.id, cl.code, cl.title, cl.sequence, cl.recommended_weeks,
                       cl.entry_guidance, cl.outcome_guidance,
                       cl.checkpoint_question_count, cl.checkpoint_pass_rate
                from learning.curriculum_levels cl
                where cl.course_version_id = @course_version_id
                order by cl.sequence;
                """;
            Add(command, "@course_version_id", course.CourseVersionId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                levels.Add(new CurriculumLevelView(
                    reader.GetGuid(0), reader.GetString(1), reader.GetString(2),
                    reader.GetInt32(3), reader.GetInt32(4), reader.GetString(5),
                    reader.GetString(6), reader.GetInt32(7), reader.GetDecimal(8)));
            }
        }

        var modules = new List<CourseModuleView>();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                select cm.id, cl.code, cm.code, cm.title, cm.summary, cm.sequence,
                       count(lv.id)::int
                from learning.course_modules cm
                join learning.curriculum_levels cl on cl.id = cm.level_id
                left join learning.lesson_versions lv
                  on lv.module_id = cm.id and lv.state = 'Published'
                where cm.course_version_id = @course_version_id
                group by cm.id, cl.code
                order by cm.sequence;
                """;
            Add(command, "@course_version_id", course.CourseVersionId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                modules.Add(new CourseModuleView(
                    reader.GetGuid(0), reader.GetString(1), reader.GetString(2),
                    reader.GetString(3), reader.GetString(4), reader.GetInt32(5),
                    reader.GetInt32(6)));
            }
        }

        return new PublishedCourseView(course, levels, modules);
    }

    public async Task<PublishedRoadmapView?> FindPublishedRoadmapAsync(
        string slug, CancellationToken cancellationToken)
    {
        if (!IsSafeCode(slug)) return null;
        await using var connection = await connections.OpenAsync(cancellationToken);
        await using var header = connection.CreateCommand();
        header.CommandText = """
            select rt.id, cv.slug, cv.version, rt.version, rt.title, rt.algorithm_version,
                   rt.session_minutes_min, rt.session_minutes_max,
                   rt.sessions_per_week_min, rt.sessions_per_week_max,
                   rt.review_ratio, rt.learning_ratio, rt.buffer_ratio,
                   rt.personalization_policy::text
            from learning.roadmap_templates rt
            join learning.course_versions cv on cv.id = rt.course_version_id
            where cv.slug = @slug and cv.state = 'Published' and rt.state = 'Published'
            order by cv.published_at desc
            limit 1;
            """;
        Add(header, "@slug", slug);
        await using var headerReader = await header.ExecuteReaderAsync(cancellationToken);
        if (!await headerReader.ReadAsync(cancellationToken)) return null;

        var roadmapId = headerReader.GetGuid(0);
        var courseSlug = headerReader.GetString(1);
        var courseVersion = headerReader.GetString(2);
        var version = headerReader.GetString(3);
        var title = headerReader.GetString(4);
        var algorithmVersion = headerReader.GetString(5);
        var sessionMinutesMin = headerReader.GetInt32(6);
        var sessionMinutesMax = headerReader.GetInt32(7);
        var sessionsPerWeekMin = headerReader.GetInt32(8);
        var sessionsPerWeekMax = headerReader.GetInt32(9);
        var reviewRatio = headerReader.GetDecimal(10);
        var learningRatio = headerReader.GetDecimal(11);
        var bufferRatio = headerReader.GetDecimal(12);
        var policy = ParseJson(headerReader.GetString(13));
        await headerReader.DisposeAsync();

        var activities = await ReadRoadmapActivitiesAsync(
            connection, roadmapId, cancellationToken);
        var weeks = new List<RoadmapWeekView>();
        await using var weeksCommand = connection.CreateCommand();
        weeksCommand.CommandText = """
            select rw.id, rw.week_number, cl.code, rw.title, rw.weekly_goal,
                   rw.vocabulary_theme, rw.checkpoint_kind, rw.pass_rate,
                   rw.remediation_rule::text
            from learning.roadmap_weeks rw
            join learning.curriculum_levels cl on cl.id = rw.level_id
            where rw.roadmap_template_id = @roadmap_id
            order by rw.week_number;
            """;
        Add(weeksCommand, "@roadmap_id", roadmapId);
        await using var weeksReader = await weeksCommand.ExecuteReaderAsync(cancellationToken);
        while (await weeksReader.ReadAsync(cancellationToken))
        {
            var weekId = weeksReader.GetGuid(0);
            weeks.Add(new RoadmapWeekView(
                weekId, weeksReader.GetInt32(1), weeksReader.GetString(2),
                weeksReader.GetString(3), weeksReader.GetString(4),
                NullableString(weeksReader, 5), NullableString(weeksReader, 6),
                weeksReader.IsDBNull(7) ? null : weeksReader.GetDecimal(7),
                ParseJson(weeksReader.GetString(8)),
                activities.TryGetValue(weekId, out var weekActivities)
                    ? weekActivities : []));
        }

        return new PublishedRoadmapView(
            roadmapId, courseSlug, courseVersion, version, title, algorithmVersion,
            sessionMinutesMin, sessionMinutesMax, sessionsPerWeekMin,
            sessionsPerWeekMax, reviewRatio, learningRatio, bufferRatio,
            policy, weeks);
    }

    public async Task<PublishedLessonView?> FindPublishedLessonAsync(
        string courseSlug, string lessonCode, CancellationToken cancellationToken)
    {
        if (!IsSafeCode(courseSlug) || !IsSafeCode(lessonCode)) return null;
        await using var connection = await connections.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select lv.id, cv.id, cv.slug, cv.version, lv.code, lv.version,
                   lv.lesson_type, lv.title, lv.objectives::text, lv.language,
                   lv.level_label, lv.skill, lv.primary_tags::text,
                   lv.estimated_minutes, lv.quiz_question_count,
                   lv.recommended_accuracy, lv.is_level_checkpoint,
                   lv.author_name, lv.rights_reference, cv.access_model, lv.is_sample
            from learning.lesson_versions lv
            join learning.course_versions cv on cv.id = lv.course_version_id
            where cv.slug = @slug and cv.state = 'Published'
              and lv.code = @lesson_code and lv.state = 'Published'
            order by cv.published_at desc, lv.published_at desc
            limit 1;
            """;
        Add(command, "@slug", courseSlug);
        Add(command, "@lesson_code", lessonCode.ToUpperInvariant());
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;

        var lessonId = reader.GetGuid(0);
        var courseVersionId = reader.GetGuid(1);
        var response = new PublishedLessonView(
            lessonId, courseVersionId, reader.GetString(2), reader.GetString(3),
            reader.GetString(4), reader.GetString(5), reader.GetString(6),
            reader.GetString(7), ParseArray<string>(reader.GetString(8)),
            reader.GetString(9), reader.GetString(10), reader.GetString(11),
            ParseArray<string>(reader.GetString(12)), reader.GetInt32(13),
            reader.IsDBNull(14) ? null : reader.GetInt32(14),
            reader.IsDBNull(15) ? null : reader.GetDecimal(15),
            reader.GetBoolean(16), reader.GetString(17), reader.GetString(18),
            reader.GetString(19), reader.GetBoolean(20),
            [], [], []);
        await reader.DisposeAsync();

        var prerequisites = await ReadPrerequisitesAsync(connection, lessonId, cancellationToken);
        var topics = await ReadTopicsAsync(connection, lessonId, cancellationToken);
        var pages = await ReadPagesAsync(connection, lessonId, cancellationToken);
        return response with
        {
            PrerequisiteCodes = prerequisites,
            Topics = topics,
            Pages = pages
        };
    }

    private static async Task<CourseCatalogEntry?> FindCourseAsync(
        DbConnection connection, string slug, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select cv.id, cv.course_id::text, cv.version, cv.slug, cv.title, cv.summary,
                   cv.language, cv.exam_profile, cv.scope, cv.level_label, cv.author_name,
                   cv.estimated_minutes, count(lv.id)::int, cv.access_model,
                   min(lv.code) filter (where lv.is_sample)
            from learning.course_versions cv
            left join learning.lesson_versions lv
              on lv.course_version_id = cv.id and lv.state = 'Published'
            where cv.slug = @slug and cv.state = 'Published'
            group by cv.id
            order by cv.published_at desc
            limit 1;
            """;
        Add(command, "@slug", slug);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? MapCourse(reader) : null;
    }

    private static CourseCatalogEntry MapCourse(DbDataReader reader) =>
        new(reader.GetGuid(0), reader.GetString(1), reader.GetString(2),
            reader.GetString(3), reader.GetString(4), reader.GetString(5),
            reader.GetString(6), reader.GetString(7), reader.GetString(8),
            reader.GetString(9), reader.GetString(10), reader.GetInt32(11),
            reader.GetInt32(12), reader.GetString(13), NullableString(reader, 14));

    private static async Task<Dictionary<Guid, IReadOnlyList<RoadmapActivityView>>>
        ReadRoadmapActivitiesAsync(DbConnection connection, Guid roadmapId,
            CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select ra.roadmap_week_id, ra.id, ra.session_order, ra.activity_type,
                   ra.title, ra.estimated_minutes, ra.required, lv.code, kt.code,
                   ra.scheduling_policy::text
            from learning.roadmap_activities ra
            join learning.roadmap_weeks rw on rw.id = ra.roadmap_week_id
            left join learning.lesson_versions lv on lv.id = ra.lesson_version_id
            left join learning.knowledge_topics kt on kt.id = ra.topic_id
            where rw.roadmap_template_id = @roadmap_id
            order by rw.week_number, ra.session_order;
            """;
        Add(command, "@roadmap_id", roadmapId);
        var grouped = new Dictionary<Guid, List<RoadmapActivityView>>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var weekId = reader.GetGuid(0);
            if (!grouped.TryGetValue(weekId, out var list))
            {
                list = [];
                grouped[weekId] = list;
            }
            list.Add(new RoadmapActivityView(
                reader.GetGuid(1), reader.GetInt32(2), reader.GetString(3),
                reader.GetString(4), reader.GetInt32(5), reader.GetBoolean(6),
                NullableString(reader, 7), NullableString(reader, 8),
                ParseJson(reader.GetString(9))));
        }
        return grouped.ToDictionary(pair => pair.Key,
            pair => (IReadOnlyList<RoadmapActivityView>)pair.Value);
    }

    private static async Task<IReadOnlyList<string>> ReadPrerequisitesAsync(
        DbConnection connection, Guid lessonId, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select prerequisite.code
            from learning.lesson_prerequisites lp
            join learning.lesson_versions prerequisite
              on prerequisite.id = lp.prerequisite_lesson_version_id
            where lp.lesson_version_id = @lesson_id
            order by prerequisite.sequence;
            """;
        Add(command, "@lesson_id", lessonId);
        var result = new List<string>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) result.Add(reader.GetString(0));
        return result;
    }

    private static async Task<IReadOnlyList<LessonTopicView>> ReadTopicsAsync(
        DbConnection connection, Guid lessonId, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select kt.id, cl.code, kt.code, kt.title_vi, kt.title_en, kt.category,
                   kt.primary_tag, kt.summary, kt.learning_objectives::text,
                   kt.core_knowledge::text, kt.common_traps::text,
                   kt.worked_examples::text, kt.vocabulary_theme, kt.estimated_minutes,
                   guide.formula_patterns::text, guide.application_steps::text,
                   guide.extensions::text, guide.self_check_prompts::text
            from learning.lesson_topics lt
            join learning.knowledge_topics kt on kt.id = lt.topic_id
            join learning.curriculum_levels cl on cl.id = kt.level_id
            left join learning.topic_learning_guides guide on guide.topic_id = kt.id
            where lt.lesson_version_id = @lesson_id and kt.state = 'Published'
            order by lt.topic_order;
            """;
        Add(command, "@lesson_id", lessonId);
        var result = new List<LessonTopicView>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            TopicGuideView? guide = null;
            if (!reader.IsDBNull(14))
            {
                guide = new TopicGuideView(
                    ParseArray<string>(reader.GetString(14)),
                    ParseArray<string>(reader.GetString(15)),
                    ParseArray<string>(reader.GetString(16)),
                    ParseArray<string>(reader.GetString(17)));
            }
            result.Add(new LessonTopicView(
                reader.GetGuid(0), reader.GetString(1), reader.GetString(2),
                reader.GetString(3), reader.GetString(4), reader.GetString(5),
                reader.GetString(6), reader.GetString(7),
                ParseArray<string>(reader.GetString(8)),
                ParseArray<string>(reader.GetString(9)),
                ParseArray<string>(reader.GetString(10)),
                ParseArray<WorkedExampleView>(reader.GetString(11)),
                NullableString(reader, 12), reader.GetInt32(13), guide));
        }
        return result;
    }

    private static async Task<IReadOnlyList<LessonPageView>> ReadPagesAsync(
        DbConnection connection, Guid lessonId, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select lp.id, lp.title, lp.page_order, lp.required,
                   lb.id, lb.block_order, lb.block_type, lb.content::text
            from learning.lesson_pages lp
            left join learning.lesson_blocks lb on lb.page_id = lp.id
            where lp.lesson_version_id = @lesson_id
            order by lp.page_order, lb.block_order;
            """;
        Add(command, "@lesson_id", lessonId);
        var pages = new List<PageBuilder>();
        PageBuilder? current = null;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var pageId = reader.GetGuid(0);
            if (current is null || current.Id != pageId)
            {
                current = new PageBuilder(pageId, reader.GetString(1),
                    reader.GetInt32(2), reader.GetBoolean(3));
                pages.Add(current);
            }
            if (!reader.IsDBNull(4))
            {
                current.Blocks.Add(new LessonBlockView(
                    reader.GetGuid(4), reader.GetInt32(5), reader.GetString(6),
                    ParseJson(reader.GetString(7))));
            }
        }
        return pages.Select(page => new LessonPageView(
            page.Id, page.Title, page.Order, page.Required, page.Blocks)).ToArray();
    }

    private static T[] ParseArray<T>(string json) =>
        JsonSerializer.Deserialize<T[]>(json, JsonOptions) ??
        throw new InvalidOperationException("Published curriculum JSON is invalid.");

    private static JsonElement ParseJson(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static string? NullableString(DbDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);

    private static bool IsSafeCode(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Length <= 100 &&
        value.All(character => char.IsAsciiLetterOrDigit(character) ||
            character is '-' or '_');

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var decomposed = value.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                builder.Append(char.ToLowerInvariant(character));
        }
        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static void Add(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private sealed record PageBuilder(Guid Id, string Title, int Order, bool Required)
    {
        public List<LessonBlockView> Blocks { get; } = [];
    }
}
