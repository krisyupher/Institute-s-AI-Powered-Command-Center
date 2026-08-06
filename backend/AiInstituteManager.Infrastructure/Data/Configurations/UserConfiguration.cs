using AiInstituteManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AiInstituteManager.Infrastructure.Data.Configurations
{
    /// <summary>
    /// IEntityTypeConfiguration&lt;T&gt; is EF Core's recommended pattern for
    /// real projects: instead of one giant OnModelCreating() method with
    /// rules for every entity crammed together, each entity gets its own
    /// small, focused configuration class. EF Core discovers all of these
    /// automatically — see ApplicationDbContext.OnModelCreating.
    /// </summary>
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.Property(u => u.FullName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(150);

            // Enforce uniqueness at the DATABASE level — two users can
            // never share an email, even if application code has a bug.
            builder.HasIndex(u => u.Email)
                .IsUnique();

            // Store the enum as its string name ("Teacher") rather than
            // its underlying int (1). Slightly more storage, but the data
            // is human-readable if you ever query the table directly.
            builder.Property(u => u.Role)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();
        }
    }
}
