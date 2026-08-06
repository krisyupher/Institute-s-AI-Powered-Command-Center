namespace AiInstituteManager.Domain.Common
{
    public abstract class BaseEntity
    {
        // Every table gets an integer primary key automatically.
        public int Id { get; set; }

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; private set; }
        public void MarkAsUpdated()
        {
            UpdatedAt = DateTime.UtcNow;
        }
    }
}