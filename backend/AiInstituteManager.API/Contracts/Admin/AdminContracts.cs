namespace AiInstituteManager.API.Contracts.Admin
{
    /// <summary>
    /// Shape required by Ticket 4.2: total users, total quizzes, and
    /// average score across all submitted student quizzes.
    /// </summary>
    public record AdminStatsResponse(
        int TotalUsers,
        int TotalQuizzes,
        double AverageScore);

    /// <summary>
    /// One quiz in the admin "all quizzes" view: system-wide stats across
    /// every teacher's quizzes plus the creator's name. Built by
    /// GET /api/admin/quizzes.
    /// </summary>
    public record AdminQuizResponse(
        int Id,
        string Title,
        bool IsPublished,
        int SubjectId,
        string SubjectName,
        string CreatedByTeacherName,
        int QuestionCount,
        int Attempts,
        double AverageScore,
        DateTime CreatedAt,
        DateTime? UpdatedAt);
}
