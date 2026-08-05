using System.Linq.Expressions;
using AiInstituteManager.Domain.Common;

namespace AiInstituteManager.Infrastructure.Repositories
{
    /// <summary>
    /// A generic repository lets us write ONE set of CRUD methods that
    /// works for User, Quiz, Question, etc. — instead of a UserRepository,
    /// QuizRepository, QuestionRepository each re-implementing the same
    /// GetById/GetAll logic five times over.
    /// "where T : BaseEntity" is a generic constraint: it means this only
    /// works for actual domain entities, not any arbitrary type.
    /// </summary>
    public interface IGenericRepository<T> where T : BaseEntity
    {
        Task<T?> GetByIdAsync(int id);
        Task<IReadOnlyList<T>> GetAllAsync();

        // Expression<Func<T,bool>> (not just Func<T,bool>) lets EF Core
        // translate the predicate into SQL — a real WHERE clause run by
        // the database — instead of pulling every row into memory first
        // and filtering in C#. This is the key difference between
        // IQueryable and IEnumerable.
        Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate);

        Task AddAsync(T entity);
        void Update(T entity);
        void Remove(T entity);
    }
}
