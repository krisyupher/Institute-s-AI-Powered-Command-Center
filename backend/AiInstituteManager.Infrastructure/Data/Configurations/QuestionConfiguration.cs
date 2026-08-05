using AiInstituteManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AiInstituteManager.Infrastructure.Data.Configurations
{
    public class QuestionConfiguration : IEntityTypeConfiguration<Question>
    {
        public void Configure(EntityTypeBuilder<Question> builder)
        {
            builder.ToTable("Questions");

            builder.Property(q => q.Text).IsRequired();
            builder.Property(q => q.OptionA).IsRequired();
            builder.Property(q => q.OptionB).IsRequired();
            builder.Property(q => q.OptionC).IsRequired();
            builder.Property(q => q.OptionD).IsRequired();

            builder.Property(q => q.CorrectAnswer)
                .HasConversion<string>()
                .HasMaxLength(1)
                .IsRequired();

            // Question -> Quiz: if a Quiz is deleted, its questions go
            // with it. This is the ONLY foreign key chain pointing at
            // Question, so Cascade here is unambiguous and safe.
            builder.HasOne(q => q.Quiz)
                .WithMany(qz => qz.Questions)
                .HasForeignKey(q => q.QuizId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
