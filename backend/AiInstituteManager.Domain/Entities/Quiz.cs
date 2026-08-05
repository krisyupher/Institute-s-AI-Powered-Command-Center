using AiInstituteManager.Domain.Common;

namespace AiInstituteManager.Domain.Entities
{
    public class Quiz : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public bool IsPublished { get; set; } = false;

        // Foreign keys are plain ints here — the *meaning* of the FK
        // relationship (cascade rules, indexes, uniqueness) is
        // Infrastructure's job, configured in QuizConfiguration.cs.
        public int SubjectId { get; set; }
        public Subject? Subject { get; set; }

        public int CreatedByTeacherId { get; set; }
        public User? CreatedByTeacher { get; set; }

        public ICollection<Question> Questions { get; set; } = new List<Question>();
        public ICollection<QuizResult> Results { get; set; } = new List<QuizResult>();
    }
}
