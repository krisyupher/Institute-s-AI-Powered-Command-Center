namespace AiInstituteManager.Infrastructure.AiGeneration.Dtos
{
    /// <summary>
    /// What OpenAiService hands back to whoever calls it — deliberately
    /// separate from the Domain "Question" entity. This DTO represents a
    /// CANDIDATE question fresh from the AI, before a teacher has reviewed
    /// or approved it (that's the QuizPreviewComponent flow from the
    /// project plan). Keeping them separate means the AI layer can change
    /// its shape without touching the persisted Question entity, and vice
    /// versa.
    /// </summary>
    public class GeneratedQuestionDto
    {
        public string Text { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;

        // Kept as a string ("A"/"B"/"C"/"D") here rather than the
        // AnswerOption enum used by the Question entity — this DTO
        // represents raw, not-yet-validated AI output. Whatever maps
        // GeneratedQuestionDto -> Question later (in the ticket that adds
        // "Publish Quiz") is the right place to parse this into the enum
        // and reject anything that isn't exactly A/B/C/D.
        public string CorrectAnswer { get; set; } = string.Empty;
    }
}