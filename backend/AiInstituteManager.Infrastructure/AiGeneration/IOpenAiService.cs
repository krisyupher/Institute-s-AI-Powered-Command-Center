using AiInstituteManager.Infrastructure.AiGeneration.Dtos;

namespace AiInstituteManager.Infrastructure.AiGeneration
{
    /// <summary>
    /// Named IOpenAiService (matching the ticket) rather than something
    /// generic like IAiService — if you later add a second provider as a
    /// fallback, you'd likely give it its own interface too, or introduce
    /// a shared IQuizGenerationService that both implement. Not needed yet
    /// — YAGNI — but worth knowing the seam is there if you need it.
    /// </summary>
    public interface IOpenAiService
    {
        Task<List<GeneratedQuestionDto>> GenerateQuizQuestionsAsync(
            string topic,
            string difficulty,
            int questionCount,
            CancellationToken cancellationToken = default);
    }
}