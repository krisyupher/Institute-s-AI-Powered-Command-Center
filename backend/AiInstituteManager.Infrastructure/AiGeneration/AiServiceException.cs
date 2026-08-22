namespace AiInstituteManager.Infrastructure.AiGeneration
{
    /// <summary>
    /// A dedicated exception type means callers (eventually a
    /// QuizController) can catch AiServiceException specifically and show
    /// the teacher a friendly "AI generation failed, try again" message,
    /// instead of a generic 500 error that could mean literally anything.
    /// </summary>
    public class AiServiceException : Exception
    {
        public AiServiceException(string message) : base(message) { }
        public AiServiceException(string message, Exception innerException) : base(message, innerException) { }
    }
}