namespace AiInstituteManager.Infrastructure.Settings
{
    /// <summary>
    /// Bound from the "OpenAi" section of appsettings.json. ApiKey should
    /// be EMPTY in appsettings.json (never commit a real key) and supplied
    /// via `dotnet user-secrets` locally, or an environment variable /
    /// Azure App Service configuration setting in deployment — same
    /// principle as the Jwt:Key secret from Ticket 2.1.
    /// </summary>
    public class OpenAiSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = "https://api.openai.com/v1/";
        public string Model { get; set; } = "gpt-4o-mini";
    }
}