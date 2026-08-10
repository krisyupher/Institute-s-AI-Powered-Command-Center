using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Domain.Enums;

namespace AiInstituteManager.Infrastructure.Data.Seed
{
    /// <summary>
    /// Raw seed values live here, separate from DbInitializer, so the
    /// *data* (what gets seeded) is easy to find and edit without touching
    /// the *orchestration logic* (how/when seeding runs). Ticket 1.2 asks
    /// for default test users + sample Subject data — this is that data.
    ///
    /// NOTE: User does not have a PasswordHash property yet because
    /// ASP.NET Core Identity is scoped for Week 2 (Ticket 2.1). Once
    /// Identity is wired in, Backend Dev will likely add a PasswordHash
    /// (or IdentityUser) column, and this seed data will need a password
    /// value added per user (e.g. "Teacher123!" as referenced in the
    /// Week 2 verification checklist).
    /// </summary>
    public static class SeedData
    {
        public static List<User> Users => new()
        {
            new User
            {
                FullName = "System Administrator",
                Email = "admin@humber.ca",
                Role = UserRole.Admin
            },
            new User
            {
                FullName = "Demo Teacher",
                Email = "teacher@humber.ca",
                Role = UserRole.Teacher
            },
            new User
            {
                FullName = "Demo Student",
                Email = "student@humber.ca",
                Role = UserRole.Student
            }
        };

        public static List<Subject> Subjects => new()
        {
            new Subject { Name = "Introduction to Programming", Code = "CS101" },
            new Subject { Name = "Data Structures and Algorithms", Code = "CS201" },
            new Subject { Name = "Database Systems", Code = "CS301" },
            new Subject { Name = "Web Application Development", Code = "CS401" },
            new Subject { Name = "Software Engineering Capstone", Code = "CS501" }
        };
    }
}
