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
}
