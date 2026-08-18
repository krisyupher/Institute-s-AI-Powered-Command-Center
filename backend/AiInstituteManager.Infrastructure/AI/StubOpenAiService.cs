namespace AiInstituteManager.Infrastructure.AI
{
    /// <summary>
    /// TEMPORARY placeholder for Ticket 3.1's real OpenAiService, which
    /// hasn't been merged yet as of Ticket 3.2. It returns clearly-fake
    /// "[STUB]" questions so you can build, run, and Swagger-test
    /// /api/quiz/generate and /api/quiz/save end-to-end right now,
    /// without waiting on Backend Dev's OpenAI/OpenRouter integration.
    ///
    /// DELETE THIS FILE once the real OpenAiService is merged, and swap
    /// the registration in QuizGenerationServiceExtensions.cs — that's
    /// the only change needed; QuizController depends on IOpenAiService,
    /// not on this class.
    /// </summary>
    public class StubOpenAiService : IOpenAiService
    {
        public Task<IReadOnlyList<GeneratedQuestion>> GenerateQuestionsAsync(
            string topic, string difficulty, int questionCount)
        {
            var questions = Enumerable.Range(1, questionCount)
                .Select(i => new GeneratedQuestion(
                    Text: $"[STUB] Sample question {i} about \"{topic}\" ({difficulty})",
                    OptionA: "Option A",
                    OptionB: "Option B",
                    OptionC: "Option C",
                    OptionD: "Option D",
                    CorrectAnswer: "A"))
                .ToList();

            return Task.FromResult<IReadOnlyList<GeneratedQuestion>>(questions);
        }
    }
}
