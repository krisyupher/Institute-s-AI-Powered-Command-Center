using System.ComponentModel.DataAnnotations;

namespace AiInstituteManager.API.Contracts.Quiz
{
    public record StudentQuestionResponse(
        int Id, string Text, string OptionA, string OptionB, string OptionC, string OptionD);

    /// <summary>A published quiz available for a student to take, returned by GET /api/quiz/available.</summary>
    public record AvailableQuizResponse(
        int Id, string Title, int SubjectId, IReadOnlyList<StudentQuestionResponse> Questions);

    /// <summary>One answer a student selected for a specific question.</summary>
    public record SubmitAnswerRequest
    {
        [Required]
        public int QuestionId { get; init; }

        [Required, RegularExpression("^[A-Da-d]$",
            ErrorMessage = "SelectedAnswer must be A, B, C, or D.")]
        public string SelectedAnswer { get; init; } = string.Empty;
    }

    /// <summary>Body for POST /api/quiz/submit.</summary>
    public record SubmitQuizRequest
    {
        [Required]
        public int QuizId { get; init; }

        [Required, MinLength(1, ErrorMessage = "At least one answer is required.")]
        public List<SubmitAnswerRequest> Answers { get; init; } = new();
    }

    /// <summary>Per-question grading detail — lets the frontend show which answers were right/wrong, not just the total.</summary>
    public record QuestionResultResponse(
        int QuestionId, string SelectedAnswer, string CorrectAnswer, bool IsCorrect);

    /// <summary>The "instant score object" the ticket asks for — returned immediately by POST /api/quiz/submit.</summary>
    public record QuizResultResponse(
        int QuizId,
        int CorrectCount,
        int TotalQuestions,
        double ScorePercentage,
        DateTime CompletedAt,
        IReadOnlyList<QuestionResultResponse> QuestionResults);
}
