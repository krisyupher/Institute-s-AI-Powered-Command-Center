namespace AiInstituteManager.API.Extensions
{
    /// <summary>
    /// The Angular dev server (http://localhost:4200) and this API
    /// (https://localhost:7083 / http://localhost:5218) are different
    /// origins, so every request from the SPA — including the login
    /// POST — is a cross-origin request. Without a CORS policy the
    /// browser blocks it before it reaches a controller; this is what
    /// makes those requests work.
    ///
    /// Mirrors the existing pattern in
    /// AiInstituteManager.Infrastructure/Extensions/ServiceCollectionExtensions.cs
    /// (an extension method that hides setup detail behind one call).
    /// </summary>
    public static class CorsExtensions
    {
        public const string FrontendPolicyName = "FrontendDev";

        public static IServiceCollection AddFrontendCors(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Configurable via "Cors:AllowedOrigins" in appsettings so a
            // deployed environment can override it without a code change;
            // falls back to the Angular dev server for local development.
            var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:4200" };

            services.AddCors(options =>
            {
                options.AddPolicy(FrontendPolicyName, policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            return services;
        }
    }
}
