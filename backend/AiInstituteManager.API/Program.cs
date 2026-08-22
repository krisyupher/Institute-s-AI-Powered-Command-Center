using AiInstituteManager.API.Extensions;
using AiInstituteManager.Domain.Entities;
using AiInstituteManager.Domain.Enums;
using AiInstituteManager.Infrastructure.AiGeneration;
using AiInstituteManager.Infrastructure.Extensions;
using AiInstituteManager.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// The Angular SPA (dev server on :4200) calls the API cross-origin. Without
// CORS the browser blocks every request — including /api/auth/login — so the
// SPA could never obtain a real JWT. Allow the dev origin explicitly rather
// than open:true; production serves the SPA from the same origin as the API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularApp", policy =>
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod());
});
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
//builder.Services.AddQuizGeneration();

// Lets the Angular dev server (a different origin) call this API.
builder.Services.AddFrontendCors(builder.Configuration);

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
app.UseCors(CorsExtensions.FrontendPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
