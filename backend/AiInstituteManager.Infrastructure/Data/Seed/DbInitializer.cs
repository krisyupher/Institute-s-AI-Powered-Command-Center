using Microsoft.EntityFrameworkCore;

namespace AiInstituteManager.Infrastructure.Data.Seed
{
    /// <summary>
    /// Ticket 1.2: Database Seeding & Initial Migration Setup.
    ///
    /// Applies any pending EF Core migrations and seeds the database with
    /// baseline test data, so every developer on the team gets an
    /// identical, working local database the moment they run
    /// `dotnet run` — no manual SQL scripts, no "works on my machine".
    /// </summary>
    public static class DbInitializer
    {
        public static async Task InitializeAsync(ApplicationDbContext context)
        {
            // Applies any migrations that haven't been applied yet
            // (equivalent to running `dotnet ef database update`).
            // Safe to call on every startup — if the DB is already
            // up to date, this is a no-op.
            await context.Database.MigrateAsync();

            await SeedSubjectsAsync(context);
            await SeedUsersAsync(context);
        }

        private static async Task SeedSubjectsAsync(ApplicationDbContext context)
        {
            // Guard clause keeps seeding idempotent: restarting the API
            // (or re-running `dotnet run`) never creates duplicate rows.
            if (await context.Subjects.AnyAsync())
            {
                return;
            }

            await context.Subjects.AddRangeAsync(SeedData.Subjects);
            await context.SaveChangesAsync();
        }

        private static async Task SeedUsersAsync(ApplicationDbContext context)
        {
            if (await context.Users.AnyAsync())
            {
                return;
            }

            await context.Users.AddRangeAsync(SeedData.Users);
            await context.SaveChangesAsync();
        }
    }
}
