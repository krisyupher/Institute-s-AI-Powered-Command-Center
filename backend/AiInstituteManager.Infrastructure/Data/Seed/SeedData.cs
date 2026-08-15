using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Domain.Enums;

namespace AiInstituteManager.Infrastructure.Data.Seed
{
    /// <summary>
    /// Raw seed values live here, separate from DbInitializer, so the
    /// *data* (what gets seeded) is easy to find and edit without touching
    /// the *orchestration logic* (how/when seeding runs).
    ///
    /// UPDATED for Ticket 2.2: since Ticket 2.1 made User extend
    /// IdentityUser&lt;int&gt;, users can no longer be inserted as plain
    /// entities — Identity needs to hash the password, and set UserName /
    /// NormalizedEmail / SecurityStamp itself. DbInitializer now creates
    /// these through UserManager instead of the raw DbSet, so each tuple
    /// below pairs a User with the plaintext password UserManager will
    /// hash on creation. These match the credentials referenced in the
    /// Detailed Plan's Week 2 login test (teacher@humber.ca / Teacher123!).
    /// </summary>
    public static class SeedData
    {
        public static IReadOnlyList<(User User, string Password)> Users => new List<(User, string)>
        {
            (new User
            {
                UserName = "admin@humber.ca",
                Email = "admin@humber.ca",
                EmailConfirmed = true,
                FullName = "System Administrator",
                Role = UserRole.Admin
            }, "Admin123!"),

            (new User
            {
                UserName = "teacher@humber.ca",
                Email = "teacher@humber.ca",
                EmailConfirmed = true,
                FullName = "Demo Teacher",
                Role = UserRole.Teacher
            }, "Teacher123!"),

            (new User
            {
                UserName = "student@humber.ca",
                Email = "student@humber.ca",
                EmailConfirmed = true,
                FullName = "Demo Student",
                Role = UserRole.Student
            }, "Student123!")
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
