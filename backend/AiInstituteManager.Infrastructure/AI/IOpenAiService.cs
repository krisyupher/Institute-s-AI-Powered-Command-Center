namespace AiInstituteManager.Infrastructure.AI
{
    /// <summary>
    /// Contract for Ticket 3.1's AI question generation service. Shaped
    /// directly from that ticket's acceptance criteria: "Service receives
    /// parameters (topic, difficulty, questionCount) and returns a parsed
    /// list of question DTOs."
    ///
    /// QuizController (Ticket 3.2) depends on THIS INTERFACE, not on a
    /// concrete OpenAiService class — Ticket 3.1 hasn't been merged yet.
    /// When Backend Dev's real OpenAiService lands, it just needs to
    /// implement IOpenAiService and get registered in place of
    /// StubOpenAiService (one line in QuizGenerationServiceExtensions.cs).
    /// QuizController itself won't need to change at all.
    /// </summary>
    public interface IOpenAiService
    {
        Task<IReadOnlyList<GeneratedQuestion>> GenerateQuestionsAsync(
            string topic, string difficulty, int questionCount);
    }

    /// <summary>
    /// One AI-drafted question, before a teacher has reviewed/edited it.
    /// CorrectAnswer is a string ("A"/"B"/"C"/"D") here rather than the
    /// AnswerOption enum, matching the plain JSON shape the ticket
    /// specifies for the AI response — QuizController parses it into the
    /// real enum only once a teacher confirms and saves the quiz.
    /// </summary>
    public record GeneratedQuestion(
        string Text,
        string OptionA,
        string OptionB,
        string OptionC,
        string OptionD,
        string CorrectAnswer);
}
