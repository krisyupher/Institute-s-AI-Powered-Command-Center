using AiInstituteManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiInstituteManager.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Set<T>() is the modern equivalent of "new DbSet<T>()" — it reads
        // slightly better and avoids a null-forgiving "= null!" on every line.
        public DbSet<User> Users => Set<User>();
        public DbSet<Subject> Subjects => Set<Subject>();
        public DbSet<Quiz> Quizzes => Set<Quiz>();
        public DbSet<Question> Questions => Set<Question>();
        public DbSet<QuizResult> QuizResults => Set<QuizResult>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Reflection-based discovery: EF Core scans THIS assembly for
            // every class implementing IEntityTypeConfiguration<T> and
            // applies it automatically. Add a new entity + its config
            // class under Data/Configurations, and it's wired in with
            // zero changes to this method.
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
