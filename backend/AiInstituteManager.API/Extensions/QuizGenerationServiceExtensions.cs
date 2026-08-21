//using AiInstituteManager.Infrastructure.AiGeneration;

//namespace AiInstituteManager.API.Extensions
//{
//    /// <summary>
//    /// Registers IOpenAiService. Kept separate from
//    /// ServiceCollectionExtensions.cs (Infrastructure) because that file
//    /// belongs to Backend Dev's Ticket 1.1/2.1 work — this way Program.cs
//    /// only needs one additive line, and swapping StubOpenAiService for
//    /// the real one later means editing ONE line, right here.
//    /// </summary>
//    public static class QuizGenerationServiceExtensions
//    {
//        public static IServiceCollection AddQuizGeneration(this IServiceCollection services)
//        {
//            services.AddHttpClient<IOpenAiService, OpenAiService>();
//            services.AddScoped<IOpenAiService, OpenAiService>();
//            return services;
//        }
//    }
//}
