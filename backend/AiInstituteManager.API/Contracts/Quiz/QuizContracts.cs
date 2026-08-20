using System.ComponentModel.DataAnnotations;

namespace AiInstituteManager.API.Contracts.Quiz
{
    /// <summary>Body for POST /api/quiz/generate.</summary>
    public record GenerateQuizRequest
    {
        [Required, MaxLength(200)]
        public string Topic { get; init; } = string.Empty;

        [Required, RegularExpression("^(Easy|Medium|Hard)$",
            ErrorMessage = "Difficulty must be Easy, Medium, or Hard.")]
        public string Difficulty { get; init; } = string.Empty;

        [Range(1, 20)]
        public int QuestionCount { get; init; } = 5;
    }

    /// <summary>One AI-drafted question returned to the frontend for review.</summary>
    public record GeneratedQuestionResponse(
        string Text, string OptionA, string OptionB, string OptionC, string OptionD, string CorrectAnswer);

    /// <summary>
    /// A single question as the teacher has finalized it, sent as part of
    /// SaveQuizRequest. CorrectAnswer stays a validated string here (not
    /// the AnswerOption enum) so a bad value fails model validation with
    /// a clear 400 instead of an unhandled parse exception in the
    /// controller.
    /// </summary>
    public record SaveQuestionRequest
    {
        [Required]
        public string Text { get; init; } = string.Empty;

        [Required] public string OptionA { get; init; } = string.Empty;
        [Required] public string OptionB { get; init; } = string.Empty;
        [Required] public string OptionC { get; init; } = string.Empty;
        [Required] public string OptionD { get; init; } = string.Empty;

        [Required, RegularExpression("^[A-Da-d]$",
            ErrorMessage = "CorrectAnswer must be A, B, C, or D.")]
        public string CorrectAnswer { get; init; } = string.Empty;
    }

    /// <summary>Body for POST /api/quiz/save — the teacher-approved final quiz.</summary>
    public record SaveQuizRequest
    {
        /// <summary>
        /// When set, save loads and updates the existing quiz with this id
        /// (edit mode, coming from the frontend quiz list) instead of
        /// inserting a new row (create mode).
        /// </summary>
        public int? Id { get; init; }

        [Required, MaxLength(200)]
        public string Title { get; init; } = string.Empty;

        [Required]
        public int SubjectId { get; init; }

        public bool IsPublished { get; init; } = false;

        [Required, MinLength(1, ErrorMessage = "A quiz needs at least one question.")]
        public List<SaveQuestionRequest> Questions { get; init; } = new();
    }

    /// <summary>Returned by POST /api/quiz/save once the quiz is persisted.</summary>
    public record QuizResponse(int Id, string Title, int SubjectId, bool IsPublished, int QuestionCount);

    /// <summary>
    /// One question as the frontend reads it back from
    /// GET /api/quiz/{id} / GET /api/quiz/my-quizzes. Mirrors the Angular
    /// `Question` model one-for-one.
    /// </summary>
    public record QuestionResponse(
        int Id, int QuizId, string Text,
        string OptionA, string OptionB, string OptionC, string OptionD,
        string CorrectAnswer, DateTime CreatedAt, DateTime? UpdatedAt);

    /// <summary>
    /// A full quiz with its nested questions, returned to the frontend
    /// editor. Mirrors the Angular `Quiz` model (minus `results`, which the
    /// teacher editor does not render).
    /// </summary>
    public record QuizDetailResponse(
        int Id, string Title, bool IsPublished, int SubjectId, int CreatedByTeacherId,
        IReadOnlyList<QuestionResponse> Questions, DateTime CreatedAt, DateTime? UpdatedAt);
}
