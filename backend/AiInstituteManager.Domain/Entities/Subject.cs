using AiInstituteManager.Domain.Common;

namespace AiInstituteManager.Domain.Entities
{
    public class Subject : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;

        public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    }
}
