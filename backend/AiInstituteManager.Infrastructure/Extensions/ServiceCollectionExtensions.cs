using AiInstituteManager.Infrastructure.Data;
using AiInstituteManager.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AiInstituteManager.Infrastructure.Extensions
{
    /// <summary>
    /// Extension methods let us "add a method" to an existing type
    /// (IServiceCollection) without modifying that type. Program.cs just
    /// calls builder.Services.AddInfrastructure(...) — all the DbContext
    /// and repository registration detail is hidden inside this one call,
    /// keeping Program.cs short and readable.
    /// </summary>
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            // Open generic registration: this ONE line tells the DI
            // container "whenever anyone asks for IGenericRepository<T>,
            // build a GenericRepository<T>" — it works for all five
            // entities without registering each one individually.
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

            services.AddScoped<IUnitOfWork, UnitOfWork>();

            return services;
        }
    }
}
