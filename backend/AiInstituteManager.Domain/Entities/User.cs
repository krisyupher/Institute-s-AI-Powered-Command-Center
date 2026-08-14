using AiInstituteManager.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace AiInstituteManager.Domain.Entities
{
    public class User : IdentityUser<int>
    {
        public string FullName { get; set; } = string.Empty;
        public UserRole Role { get; set; }

        // BaseEntity is gone from this class now, so CreatedAt/UpdatedAt
        // need to be re-declared directly here.
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; private set; }
        public void MarkAsUpdated() => UpdatedAt = DateTime.UtcNow;
        public ICollection<Quiz> QuizzesCreated { get; set; } = new List<Quiz>();
        public ICollection<QuizResult> QuizResults { get; set; } = new List<QuizResult>();
    }
}