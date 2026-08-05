namespace AiInstituteManager.Domain.Common
{
    /// <summary>
    /// Base class for every entity in the system.
    /// Centralizing Id + audit timestamps here means every entity gets
    /// this behavior "for free" just by inheriting from BaseEntity —
    /// shared structure defined once, specialized per entity via inheritance.
    /// This is also what lets our generic repository work later
    /// (it constrains itself to "anything that is a BaseEntity").
    /// </summary>
    public abstract class BaseEntity
    {
        // Every table gets an integer primary key automatically.
        public int Id { get; set; }

        // private set: CreatedAt can only be touched from inside this class,
        // so no other code can accidentally overwrite the creation timestamp.
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; private set; }

        // Controlled mutation: the only way to change UpdatedAt is through
        // this method, not by setting the property directly. This is
        // encapsulation — protecting the rules around your own data instead
        // of trusting every caller to remember them.
        public void MarkAsUpdated()
        {
            UpdatedAt = DateTime.UtcNow;
        }
    }
}