using System.Linq.Expressions;
using AiInstituteManager.Domain.Common;
using AiInstituteManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AiInstituteManager.Infrastructure.Repositories
{
    /// <summary>
    /// One implementation, reused for every entity type via generics.
    /// Note this class does NOT call SaveChanges() — that's the
    /// UnitOfWork's job (see IUnitOfWork/UnitOfWork below). Separating
    /// "stage a change" (repository) from "commit all changes" (unit of
    /// work) lets a single business operation touch multiple entities —
    /// e.g. saving a Quiz AND its Questions — and commit them together,
    /// atomically, in one SaveChangesAsync() call.
    /// </summary>
    public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
    {
        private readonly ApplicationDbContext _context;
        private readonly DbSet<T> _dbSet;

        public GenericRepository(ApplicationDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public async Task<T?> GetByIdAsync(int id)
            => await _dbSet.FindAsync(id);

        public async Task<IReadOnlyList<T>> GetAllAsync()
            // AsNoTracking(): we're only reading, not planning to update
            // these rows, so tell EF Core not to bother tracking changes
            // on them. Meaningfully faster for read-only queries.
            => await _dbSet.AsNoTracking().ToListAsync();

        public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate)
            => await _dbSet.Where(predicate).ToListAsync();

        public async Task AddAsync(T entity)
            => await _dbSet.AddAsync(entity);

        public void Update(T entity)
            => _dbSet.Update(entity);

        public void Remove(T entity)
            => _dbSet.Remove(entity);
    }
}
