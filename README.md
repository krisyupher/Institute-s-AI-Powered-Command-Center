# Institute AI Management System

## Prerequisites
- Windows with .NET 10 SDK installed
- Node.js 18+ for frontend

## Recreate Database
```
cd backend
npm run db-migrate
```
Equivalent manual commands:
```
cd backend/AiInstituteManager.API
dotnet ef database update
```
Default connection string is SQL Server LocalDB (`Server=(localdb)\mssqllocaldb;Database=AiInstituteManagerDb`), not Azure SQL yet. Seeding is idempotent — runs on every startup via `ApplyDbMigrationsAndSeedAsync()`.

## Run Backend API

### Simple method (npm)
```
cd backend
npm start
```
Starts **both** HTTP and HTTPS servers concurrently:
- HTTP API: http://localhost:5218
- HTTPS API: https://localhost:7083
- Swagger UI: https://localhost:7083/swagger (or http://localhost:5218/swagger)

### Manual method
```
cd backend/AiInstituteManager.API
dotnet run
```
- HTTP profile: http://localhost:5218
- HTTPS profile: https://localhost:7083;http://localhost:5218

### Other scripts
```
cd backend
npm run start-http    # HTTP only (port 5218)
npm run start-https   # HTTPS only (port 7083)
npm run build
npm run test
```

## Run Frontend Web App

```
cd FrontEnd
npm install
npm start
```
- App: http://localhost:4200
- API base URL points at the HTTPS profile (`https://localhost:7083`) directly — the API calls `UseHttpsRedirection()`, so hitting HTTP just 307-redirects, and CORS preflights don't reliably survive a redirect.

## Demo Accounts

Seeded by `backend/AiInstituteManager.Infrastructure/Data/Seed/SeedData.cs`. Passwords are hashed by `UserManager` on creation — these are the plaintext credentials used at login.

| Role       | Email                  | Password    |
|------------|------------------------|-------------|
| Student    | student@humber.ca      | Student123! |
| Teacher    | teacher@humber.ca      | Teacher123! |
| Administrator | admin@humber.ca    | Admin123!   |

## Swagger API Documentation

- Access at: https://localhost:7083/swagger (or http://localhost:5218/swagger)
- Displays all API endpoints
- Allows testing requests directly from browser
- Shows request/response models, authentication requirements
- Ideal for exploring endpoints before making frontend changes
- Bearer auth: enter `Bearer` + space + JWT token from `/api/auth/login`

## Backend NPM Scripts (cd backend)

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm start`       | Run both HTTP + HTTPS servers        |
| `npm run start-http`  | HTTP only (port 5218)            |
| `npm run start-https` | HTTPS only (port 7083)           |
| `npm run db-migrate` | Apply pending migrations         |
| `npm run build`   | Build solution                       |
| `npm run test`    | Run unit tests                       |

## Configuration

### API Keys and Secrets

**Important:** Never commit real API keys or JWT secrets to the repository. The `appsettings.json` file contains **empty placeholders** for these values. You must set them locally using one of the methods below.

#### For Local Development (User Secrets)

1. **Initialize user secrets** (run from `backend/AiInstituteManager.API`):
   ```bash
   dotnet user-secrets init
   ```

2. **Set the JWT signing key** (use a strong, random string):
   ```bash
   dotnet user-secrets set "Jwt:Key" "your-strong-jwt-secret-here"
   ```

3. **Set the OpenAI API key** (get one from [Groq](https://console.groq.com/)):
   ```bash
   dotnet user-secrets set "OpenAi:ApiKey" "your-groq-api-key-here"
   ```

4. **Verify the settings are stored** (optional):
   ```bash
   dotnet user-secrets list
   ```

The secrets are stored in `~/.microsoft/usersecrets/` on your machine and are **never** committed to git.

#### For Staging/Production (Environment Variables)

Set environment variables with the `__` (double underscore) separator:

**Linux/macOS:**
```bash
export Jwt__Key="your-jwt-secret"
export OpenAi__ApiKey="your-api-key"
```

**Windows PowerShell:**
```powershell
$env:Jwt__Key="your-jwt-secret"
$env:OpenAi__ApiKey="your-api-key"
```

**Windows CMD:**
```cmd
set Jwt__Key=your-jwt-secret
set OpenAi__ApiKey=your-api-key
```

#### For Cloud Deployments (Azure Key Vault / AWS Secrets Manager)

Use a managed secrets service. For Azure, add the `Azure.Identity` and `Azure.Security.KeyVault.Secrets` NuGet packages, then in `Program.cs`:

```csharp
builder.Configuration.AddAzureKeyVault(
    new Uri("https://your-vault.vault.azure.net/"),
    new DefaultAzureCredential());
```

#### Configuration Precedence

The .NET configuration system merges settings in this order (later overrides earlier):
1. `appsettings.json`
2. `appsettings.{Environment}.json`
3. User secrets (development only)
4. Environment variables
5. Command-line arguments

This means you can override any setting without modifying committed files.

### Other Configuration

Edit `backend/AiInstituteManager.API/appsettings.json`:
- `ConnectionStrings:Default` - SQL Server LocalDB (default), not Azure SQL yet
- `Cors:AllowedOrigins` - Defaults to `http://localhost:4200`
- `Jwt:Issuer` and `Jwt:Audience` - Token validation parameters
- `OpenAi:BaseUrl` and `OpenAi:Model` - AI service endpoint

## Development Notes

- Database changes: `npm run db-migrate` after modifying entity configs
- TypeScript models under `core/models/` mirror the C# entities one-for-one — change both sides together
- Use Swagger to verify endpoint signatures and auth requirements
- Frontend must route all AI requests through the ASP.NET Core API (no direct DB access)
- Quiz/admin data is still mocked in the frontend — method signatures match `docs/PROJECT_PLAN.md` endpoints, so wiring the real API means swapping the body for `this.http.*` with no caller changes

## Key Files

- `backend/AiInstituteManager.API/Program.cs` - App entry, config, migration seeding
- `backend/AiInstituteManager.Infrastructure/Data/ApplicationDbContext.cs` - EF Core DbContext
- `backend/AiInstituteManager.Infrastructure/Data/Seed/SeedData.cs` - Seed data (users, subjects)
- `backend/AiInstituteManager.Infrastructure/Migrations/` - Migration history
- `docs/PROJECT_PLAN.md` - Detailed project plan and milestones
