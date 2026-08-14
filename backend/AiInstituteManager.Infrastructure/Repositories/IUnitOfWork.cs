using AiInstituteManager.Domain.Entities;

namespace AiInstituteManager.Infrastructure.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<Subject> Subjects { get; }
        IGenericRepository<Quiz> Quizzes { get; }
        IGenericRepository<Question> Questions { get; }
        IGenericRepository<QuizResult> QuizResults { get; }

        Task<int> SaveChangesAsync();
    }
}
