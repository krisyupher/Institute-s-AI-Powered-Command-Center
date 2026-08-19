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

Edit `backend/AiInstituteManager.API/appsettings.json`:
- `Jwt:SigningKey` - Must be set for production (currently placeholder)
- `ConnectionStrings:Default` - SQL Server LocalDB (default), not Azure SQL yet
- `Cors:AllowedOrigins` - Defaults to `http://localhost:4200`

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