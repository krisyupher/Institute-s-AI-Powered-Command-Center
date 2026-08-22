using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Infrastructure.AiGeneration;
using AiInstituteManager.Infrastructure.Data;
using AiInstituteManager.Infrastructure.Services;
using AiInstituteManager.Infrastructure.Repositories;
using AiInstituteManager.Infrastructure.Settings;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;

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

            // ASP.NET Core Identity: manages users, password hashing, and
            // login validation. AddEntityFrameworkStores wires it to OUR
            // ApplicationDbContext instead of an in-memory store, so
            // Identity's tables live in the same SQL Server database as
            // everything else.
            services.AddIdentity<User, IdentityRole<int>>(options =>
            {
                options.User.RequireUniqueEmail = true;

                // Relaxed for local dev so you're not fighting password
                // complexity rules while testing — tighten these
                // (require digits, uppercase, symbols, longer length)
                // before this ever goes anywhere near production.
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 6;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            // Binds the "Jwt" section of appsettings.json onto JwtSettings,
            // so JwtTokenService can ask for IOptions<JwtSettings> instead
            // of reading raw config strings itself.
            services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
            services.AddScoped<ITokenService, JwtTokenService>();

            services.Configure<OpenAiSettings>(configuration.GetSection("OpenAi"));

            // Typed HttpClient: DI builds and manages ONE pooled HttpClient
            // for IOpenAiService, instead of OpenAiService newing one up
            // itself (a classic source of socket exhaustion under load).
            // The lambda has access to the service provider, so it can
            // pull OpenAiSettings out of configuration to set the base
            // address and auth header once, here — not on every call.
            services.AddHttpClient<IOpenAiService, OpenAiService>((serviceProvider, client) =>
            {
                var settings = serviceProvider.GetRequiredService<IOptions<OpenAiSettings>>().Value;

                client.BaseAddress = new Uri(settings.BaseUrl);
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", settings.ApiKey);
                client.Timeout = TimeSpan.FromSeconds(60);
            });

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
