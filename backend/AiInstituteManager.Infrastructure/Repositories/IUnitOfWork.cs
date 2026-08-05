using AiInstituteManager.Domain.Entities;

namespace AiInstituteManager.Infrastructure.Repositories
{
    /// <summary>
    /// The Unit of Work groups every repository behind one object so a
    /// controller can stage changes across several entities and then
    /// commit them together with a single SaveChangesAsync() call — e.g.
    /// "create a Quiz + its Questions" either saves as one atomic unit,
    /// or, if something throws halfway through, saves nothing at all.
    /// </summary>
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<User> Users { get; }
        IGenericRepository<Subject> Subjects { get; }
        IGenericRepository<Quiz> Quizzes { get; }
        IGenericRepository<Question> Questions { get; }
        IGenericRepository<QuizResult> QuizResults { get; }

        Task<int> SaveChangesAsync();
    }
}
