using AiInstituteManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AiInstituteManager.Infrastructure.Data.Configurations
{
    public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
    {
        public void Configure(EntityTypeBuilder<Subject> builder)
        {
            builder.ToTable("Subjects");

            builder.Property(s => s.Name).IsRequired().HasMaxLength(100);
            builder.Property(s => s.Code).IsRequired().HasMaxLength(20);

            // Course codes ("CS101") should be unique across the institute.
            builder.HasIndex(s => s.Code).IsUnique();
        }
    }
}
