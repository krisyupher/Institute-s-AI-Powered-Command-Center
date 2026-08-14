using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Infrastructure.Data;

namespace AiInstituteManager.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private readonly Lazy<IGenericRepository<Subject>> _subjects;
        private readonly Lazy<IGenericRepository<Quiz>> _quizzes;
        private readonly Lazy<IGenericRepository<Question>> _questions;
        private readonly Lazy<IGenericRepository<QuizResult>> _quizResults;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;

            _subjects = new Lazy<IGenericRepository<Subject>>(() => new GenericRepository<Subject>(_context));
            _quizzes = new Lazy<IGenericRepository<Quiz>>(() => new GenericRepository<Quiz>(_context));
            _questions = new Lazy<IGenericRepository<Question>>(() => new GenericRepository<Question>(_context));
            _quizResults = new Lazy<IGenericRepository<QuizResult>>(() => new GenericRepository<QuizResult>(_context));
        }

        public IGenericRepository<Subject> Subjects => _subjects.Value;
        public IGenericRepository<Quiz> Quizzes => _quizzes.Value;
        public IGenericRepository<Question> Questions => _questions.Value;
        public IGenericRepository<QuizResult> QuizResults => _quizResults.Value;

        public async Task<int> SaveChangesAsync()
            => await _context.SaveChangesAsync();

        public void Dispose()
        {
            _context.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
