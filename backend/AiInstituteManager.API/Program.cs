using AiInstituteManager.API.Extensions;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Domain.Enums;
using AiInstituteManager.Infrastructure.Extensions;
using AiInstituteManager.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by a space and your JWT token, e.g. \"Bearer eyJhbGci...\""
    });

    // AddSecurityRequirement now takes a delegate that receives the
    // in-progress OpenApiDocument, because OpenApiSecuritySchemeReference
    // needs to resolve against it — this is the new pattern for
    // Swashbuckle 10.x / Microsoft.OpenApi 2.x.
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});



// One line pulls in DbContext + generic repositories + UnitOfWork.
// See: AiInstituteManager.Infrastructure/Extensions/ServiceCollectionExtensions.cs
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddQuizGeneration();

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
