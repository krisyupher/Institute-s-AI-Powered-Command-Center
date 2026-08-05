using AiInstituteManager.Domain.Common;
using AiInstituteManager.Domain.Enums;

namespace AiInstituteManager.Domain.Entities
{
    public class User : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }

        public ICollection<Quiz> QuizzesCreated { get; set; } = new List<Quiz>();
        public ICollection<QuizResult> QuizResults { get; set; } = new List<QuizResult>();
    }
}
