# Institute AI Management System

## Prerequisites
- Windows with .NET 8 SDK installed
- Node.js 18+ for frontend

## Recreate Database (npm scripts)
```
cd backend
npm run db-reset   # deletes institute.db and runs migrations
```
Equivalent manual commands:
```
cd backend/AiInstituteManager.API
del institute.db
dotnet ef database update
```

## Run Backend API

### Simple method (npm)
```
cd backend
npm start
```

### Manual method
```
cd backend/AiInstituteManager.API
dotnet run
```
- API: http://localhost:5133
- Swagger UI: http://localhost:5133/swagger

## Run Frontend Web App

```
cd FrontEnd
npm install
npm start
```
- App: http://localhost:4200

## Demo Accounts

| Role       | Email                      | Password     |
|------------|----------------------------|--------------|
| Student    | ana.morales@institute.edu  | Student123!  |
| Teacher    | e.rivera@institute.edu      | Teacher123!  |
| Administrator | admin@institute.edu    | Admin123!    |

## AI Assistant

1. Log in as student (e.g., ana.morales)
2. Open AI Assistant in web app
3. Example commands:
   - `Add Class #4 to my calendar`
   - `What classes do I have tomorrow?`
   - `Show me my assignments for this week`
   - `When is my next Computer Science class?`

## Swagger API Documentation

- Access at: http://localhost:5133/swagger
- Displays all API endpoints
- Allows testing requests directly from browser
- Shows request/response models, authentication requirements
- Ideal for exploring endpoints before making frontend changes

## Backend NPM Scripts (cd backend)

| Command         | Description                    |
|-----------------|--------------------------------|
| `npm start`     | Runs API server                |
| `npm run db-reset` | Delete DB + run migrations   |
| `npm run db-migrate` | Apply pending migrations   |
| `npm run build` | Build solution                 |
| `npm run test`  | Run unit tests                 |

## Configuration

Edit `backend/AiInstituteManager.API/appsettings.json`:
- `Jwt:SigningKey` - Must be set for production (currently placeholder)
- `Ai:Provider` - Choose: `offline` (default) or `claude`
- `ConnectionStrings:Default` - SQLite path if needed

## Development Notes

- Database changes: `npm run db-migrate` after modifying entity configs
- AI assistant calls flow through same API security as HTTP requests
- Use Swagger to verify endpoint signatures and auth requirements
- Frontend must route all AI requests through the ASP.NET Core API (no direct DB access)

## Key Files

- `backend/AiInstituteManager.API/Program.cs` - App entry, config, migration seeding
- `backend/AiInstituteManager.Infrastructure/Data/ApplicationDbContext.cs` - EF Core DbContext
- `backend/AiInstituteManager.Infrastructure/Migrations/` - Migration history
- `docs/PROJECT_PLAN.md` - Detailed project plan and milestones