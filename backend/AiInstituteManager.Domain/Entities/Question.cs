using AiInstituteManager.Domain.Common;
using AiInstituteManager.Domain.Enums;

namespace AiInstituteManager.Domain.Entities
{
    public class Question : BaseEntity
    {
        public int QuizId { get; set; }
        public Quiz? Quiz { get; set; }

        public string Text { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;

        public AnswerOption CorrectAnswer { get; set; }
    }
}
