using AiInstituteManager.Infrastructure.Data;
using AiInstituteManager.Infrastructure.Data.Seed;

namespace AiInstituteManager.API.Extensions
{
    /// <summary>
    /// Keeps Program.cs clean: all the ceremony around creating a DI
    /// scope, resolving the DbContext, and logging success/failure lives
    /// here. Program.cs only needs to add ONE line — see the setup guide.
    ///
    /// This mirrors the existing pattern in
    /// AiInstituteManager.Infrastructure/Extensions/ServiceCollectionExtensions.cs
    /// (an extension method that hides setup detail behind one call).
    /// </summary>
    public static class DatabaseSeedingExtensions
    {
        public static async Task ApplyDbMigrationsAndSeedAsync(this WebApplication app)
        {
            // A scope is required because ApplicationDbContext is
            // registered as Scoped, but this method runs during startup,
            // outside of any HTTP request scope.
            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;
            var logger = services.GetRequiredService<ILogger<Program>>();

            try
            {
                var context = services.GetRequiredService<ApplicationDbContext>();
                await DbInitializer.InitializeAsync(context);
                logger.LogInformation("Database migrated and seed data verified successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while migrating or seeding the database.");
                throw;
            }
        }
    }
}
