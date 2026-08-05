using AiInstituteManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AiInstituteManager.Infrastructure.Data.Configurations
{
    public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
    {
        public void Configure(EntityTypeBuilder<Quiz> builder)
        {
            builder.ToTable("Quizzes");

            builder.Property(q => q.Title).IsRequired().HasMaxLength(200);

            // Quiz -> Subject: many quizzes belong to one subject.
            // Restrict (not Cascade) means deleting a Subject with quizzes
            // attached is BLOCKED rather than silently wiping quiz data —
            // safer default for a first version of the system.
            builder.HasOne(q => q.Subject)
                .WithMany(s => s.Quizzes)
                .HasForeignKey(q => q.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);

            // Quiz -> User (teacher): explicitly named FK + Restrict avoids
            // the "multiple cascade paths" error SQL Server throws when
            // more than one FK chain could reach the same row (User is
            // also referenced from QuizResult, so two paths would collide
            // if both were left on Cascade).
            builder.HasOne(q => q.CreatedByTeacher)
                .WithMany(u => u.QuizzesCreated)
                .HasForeignKey(q => q.CreatedByTeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
