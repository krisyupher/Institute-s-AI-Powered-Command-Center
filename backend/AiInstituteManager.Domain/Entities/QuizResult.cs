using AiInstituteManager.Domain.Common;

namespace AiInstituteManager.Domain.Entities
{
    public class QuizResult : BaseEntity
    {
        public int QuizId { get; set; }
        public Quiz? Quiz { get; set; }

        public int StudentId { get; set; }
        public User? Student { get; set; }

        public double Score { get; set; }
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    }
}
