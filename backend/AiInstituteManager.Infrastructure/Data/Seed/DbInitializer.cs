using AiInstituteManager.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AiInstituteManager.Infrastructure.Data.Seed
{
    /// <summary>
    /// Ticket 1.2: Database Seeding & Initial Migration Setup.
    /// UPDATED for Ticket 2.2 to seed users through UserManager (see
    /// SeedData.cs for why) instead of the raw DbSet.
    ///
    /// Applies any pending EF Core migrations and seeds the database with
    /// baseline test data, so every developer on the team gets an
    /// identical, working local database the moment they run
    /// `dotnet run` — no manual SQL scripts, no "works on my machine".
    /// </summary>
    public static class DbInitializer
    {
        public static async Task InitializeAsync(ApplicationDbContext context, UserManager<User> userManager)
        {
            // Applies any migrations that haven't been applied yet
            // (equivalent to running `dotnet ef database update`).
            // Safe to call on every startup — if the DB is already
            // up to date, this is a no-op.
            await context.Database.MigrateAsync();

            await SeedSubjectsAsync(context);
            await SeedUsersAsync(userManager);
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

        private static async Task SeedUsersAsync(UserManager<User> userManager)
        {
            foreach (var (user, password) in SeedData.Users)
            {
                // Per-user existence check (rather than "if any users
                // exist, skip all") so adding a 4th seed user later still
                // gets created even if the first 3 already exist.
                var existing = await userManager.FindByEmailAsync(user.Email!);
                if (existing is not null)
                {
                    continue;
                }

                // CreateAsync hashes the password and saves the user in
                // one call — this is what makes the seeded accounts
                // actually usable against POST /api/auth/login.
                await userManager.CreateAsync(user, password);
            }
        }
    }
}
