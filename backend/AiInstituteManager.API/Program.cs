using System.Text;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Domain.Enums;
using AiInstituteManager.Infrastructure.Identity;
using AiInstituteManager.Infrastructure.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using AiInstituteManager.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// One line pulls in DbContext + generic repositories + UnitOfWork.
// See: AiInstituteManager.Infrastructure/Extensions/ServiceCollectionExtensions.cs
builder.Services.AddInfrastructure(builder.Configuration);

// Authentication: tells ASP.NET Core HOW to validate a token presented on
// an incoming request. This is the mirror image of JwtTokenService, which
// only CREATES tokens — this is what checks them.
var jwtSection = builder.Configuration.GetSection("Jwt");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            // Same secret used to SIGN tokens in JwtTokenService — if
            // these two ever disagree, every token fails validation.
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSection["Key"] ?? string.Empty))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

await app.ApplyDbMigrationsAndSeedAsync();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
