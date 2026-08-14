namespace AiInstituteManager.Infrastructure.Settings
{
    /// <summary>
    /// Strongly-typed configuration bound to the "Jwt" section of
    /// appsettings.json via the Options pattern
    /// (services.Configure&lt;JwtSettings&gt;(...) in ServiceCollectionExtensions).
    /// Beats reading raw strings out of IConfiguration by hand every time
    /// you need a JWT setting — one bound object, injected via
    /// IOptions&lt;JwtSettings&gt; wherever it's needed.
    /// </summary>
    public class JwtSettings
    {
        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpiryMinutes { get; set; } = 60;
    }
}
