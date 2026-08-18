using AiInstituteManager.Infrastructure.AI;

namespace AiInstituteManager.API.Extensions
{
    /// <summary>
    /// Registers IOpenAiService. Kept separate from
    /// ServiceCollectionExtensions.cs (Infrastructure) because that file
    /// belongs to Backend Dev's Ticket 1.1/2.1 work — this way Program.cs
    /// only needs one additive line, and swapping StubOpenAiService for
    /// the real one later means editing ONE line, right here.
    /// </summary>
    public static class QuizGenerationServiceExtensions
    {
        public static IServiceCollection AddQuizGeneration(this IServiceCollection services)
        {
            // TODO (post Ticket 3.1): replace StubOpenAiService with the
            // real OpenAiService once Backend Dev merges it.
            services.AddScoped<IOpenAiService, StubOpenAiService>();
            return services;
        }
    }
}
