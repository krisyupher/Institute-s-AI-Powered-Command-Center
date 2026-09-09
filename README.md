# Institute AI Management System

Institute AI Management System is an Angular and ASP.NET Core web application for creating, reviewing,
publishing, and taking AI-generated quizzes in an institute or classroom setting.
It provides separate workflows for teachers, students, and administrators while
keeping authentication, persistence, AI calls, and grading behind the backend API.

> This README describes the current implementation. The target Azure deployment
> described in [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) is still a roadmap item.

## Current capabilities

### Teacher

- Sign in or register with a teacher account.
- Select an existing subject or create a new subject from the quiz generator.
- Generate 1-20 multiple-choice questions by topic and difficulty (Easy, Medium,
  or Hard).
- Review and edit the generated title, questions, options, and correct answers before
  publishing.
- Add, delete, and reorder questions in the preview editor.
- Publish a quiz, edit quizzes owned by the teacher, and delete those quizzes.

### Student

- View published quizzes available to students.
- Take quizzes one question at a time with progress and question navigation.
- Submit answers for server-side grading.
- Receive an immediate score and per-question feedback.
- Review previous quiz results and pass/fail status. The UI uses a 60% passing
  threshold.

### Administrator

- View live system statistics: total users, total quizzes, and average score.
- View every quiz with its subject, creator, question count, attempts, average score,
  publication status, and creation date.
- Open, edit, publish, or delete quizzes through the shared preview editor.

## Architecture

~~~text
Angular 22 SPA (FrontEnd)
        |
        | HTTPS JSON + JWT bearer authentication
        v
ASP.NET Core 10 API (backend/AiInstituteManager.API)
        |
        +--> EF Core + ASP.NET Identity --> SQL Server LocalDB by default
        |
        +--> OpenAI-compatible chat completions provider for quiz generation
~~~

The repository is split into two application roots; there is no root package.json:

~~~text
FrontEnd/                         Angular SPA and frontend tests
backend/
  AiInstituteManager.API/         Controllers, DTO contracts, startup, Swagger
  AiInstituteManager.Infrastructure/ EF Core, migrations, repositories, AI service
  AiInstituteManager.Domain/      Entities and enums
docs/PROJECT_PLAN.md              Technical blueprint and future roadmap
~~~

### Backend design

- The API targets net10.0 and is the only layer exposed to the browser.
- ASP.NET Identity stores users and hashes passwords. JWTs contain the user id,
  email, full name, and role.
- EF Core uses SQL Server and applies entity configurations discovered from the
  Infrastructure assembly.
- Controllers write through the generic repository and IUnitOfWork abstractions.
- OpenAiService calls the configured provider's chat/completions endpoint, requests
  structured JSON, validates generated questions, chunks larger requests, and retries
  transient failures.
- The API runs pending migrations and verifies seed data during startup.

### Frontend design

- Angular standalone components use strict TypeScript, signals, OnPush change
  detection, and lazy-loaded feature routes.
- AuthService stores only the JWT in localStorage under institute.jwt; the current
  user, role, and authentication state are derived from its claims.
- A functional HTTP interceptor adds Authorization: Bearer <token> to protected
  requests.
- authGuard protects the application shell and roleGuard protects role-specific
  branches.
- Tailwind CSS v4 and DaisyUI v5 provide the UI styling and corporate/light themes.

## API reference

Swagger is available in Development at https://localhost:7083/swagger.
Use the Authorize button with Bearer <jwt> when testing protected endpoints.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | /api/auth/register | Anonymous | Create an account and return a JWT. |
| POST | /api/auth/login | Anonymous | Validate credentials and return a JWT. |
| GET | /api/auth/me | Authenticated | Verify the current JWT and view its claims. |
| GET | /api/subjects | Authenticated | List the subject catalog. |
| POST | /api/subjects | Teacher | Create a subject. |
| PUT | /api/subjects/{id} | Teacher | Update a subject. |
| DELETE | /api/subjects/{id} | Teacher | Delete an unused subject. |
| POST | /api/quiz/generate | Teacher, Admin | Generate an AI quiz draft. |
| POST | /api/quiz/save | Teacher, Admin | Create or update a reviewed quiz. |
| GET | /api/quiz/{id} | Teacher, Admin | Load a quiz with its correct answers for editing. |
| GET | /api/quiz/my-quizzes | Teacher, Admin | List quizzes created by the current user. |
| DELETE | /api/quiz/{id} | Teacher, Admin | Delete an owned quiz; admins may moderate any quiz. |
| GET | /api/quiz/available | Student | List published quizzes without correct answers. |
| POST | /api/quiz/submit | Student | Grade answers, enforce attempt limits, and record a result. |
| GET | /api/quiz/results | Student | List the current student's result history. |
| GET | /api/admin/stats | Admin | Return system-wide user, quiz, and score statistics. |
| GET | /api/admin/quizzes | Admin | Return all quizzes and their aggregate statistics. |

Important API behavior:

- POST /api/quiz/save creates a quiz when id is omitted and replaces the quiz's
  question set when id is supplied.
- IsPublished is explicit and defaults to false in the backend. AI generation never
  publishes a quiz automatically.
- Student quiz responses intentionally omit CorrectAnswer; grading compares the
  submitted options with the database values on the server.
- MaxAttempts is optional. A null value means unlimited attempts, and the backend
  returns 409 Conflict after a configured limit is reached.
- Request validation rejects invalid difficulty values, empty question sets, and
  answer choices outside A, B, C, and D.

## Frontend routes

Public routes:

- /login - sign in.
- /register - create an account.

Teacher routes:

- /teacher/generator - choose criteria and generate a draft.
- /teacher/quizzes - manage the teacher's quizzes.
- /teacher/preview - review and publish a generated draft.
- /teacher/preview/:quizId - edit a persisted quiz.

Student routes:

- /student/quizzes - browse published quizzes.
- /student/quizzes/:quizId - take a quiz.
- /student/results - view the latest submission and result history.

Administrator routes:

- /admin/dashboard - view analytics and all quizzes.
- /admin/preview/:quizId - edit a quiz through the shared preview component.

The older /dashboard/* branch remains for compatibility and role-specific dashboard
links. /dashboard/admin redirects to /admin/dashboard. The course and assignment
routes currently lead to a Not built yet page because those features do not have
backend entities or endpoints.

## Prerequisites

- Windows with the .NET 10 SDK installed.
- Node.js and npm. The frontend package declares npm 10.9.2 as its package manager.
- SQL Server LocalDB, or another SQL Server instance supplied through configuration.
- The dotnet ef command for database migration work.
- An API key for the configured OpenAI-compatible quiz-generation provider.

The default local database is:

~~~text
Server=(localdb)\\mssqllocaldb;Database=AiInstituteManagerDb;
Trusted_Connection=True;MultipleActiveResultSets=true
~~~

The current default AI provider is Groq through its OpenAI-compatible API:

~~~text
Base URL: https://api.groq.com/openai/v1/
Model:    openai/gpt-oss-20b
~~~

The provider is configurable; the service is not hard-coded to Groq despite the
OpenAi configuration section name.

## Local setup

### 1. Configure backend secrets

Never commit a real JWT signing key or AI API key. appsettings.json contains empty
placeholders for both secrets. For local development, run these commands from
backend/AiInstituteManager.API:

~~~powershell
dotnet user-secrets set "Jwt:Key" "replace-with-a-long-random-secret"
dotnet user-secrets set "OpenAi:ApiKey" "replace-with-your-provider-key"
~~~

Optional provider overrides can be stored the same way:

~~~powershell
dotnet user-secrets set "OpenAi:BaseUrl" "https://api.groq.com/openai/v1/"
dotnet user-secrets set "OpenAi:Model" "openai/gpt-oss-20b"
dotnet user-secrets set "OpenAi:ChunkSize" "5"
dotnet user-secrets set "OpenAi:MaxAttempts" "3"
~~~

For deployed environments, use configuration providers such as environment variables,
Azure App Service settings, or a managed secret store. .NET converts configuration
colons to double underscores in environment variable names:

~~~powershell
$env:Jwt__Key = 'replace-with-a-long-random-secret'
$env:OpenAi__ApiKey = 'replace-with-your-provider-key'
$env:OpenAi__BaseUrl = 'https://api.groq.com/openai/v1/'
$env:OpenAi__Model = 'openai/gpt-oss-20b'
~~~

Configuration precedence is, from lowest to highest priority:

1. appsettings.json
2. appsettings.{Environment}.json
3. Development user secrets
4. Environment variables
5. Command-line arguments

A generic root .env file is not loaded automatically by ASP.NET Core. Use .NET
user secrets or an environment variable instead.

### 2. Apply migrations

From backend, use the explicit Infrastructure/startup project split:

~~~powershell
dotnet ef database update --project AiInstituteManager.Infrastructure --startup-project AiInstituteManager.API
~~~

The API also runs Database.MigrateAsync() and idempotent seed checks on startup,
so a normal API launch applies pending migrations automatically.

To create a migration after changing the domain model or EF configuration:

~~~powershell
dotnet ef migrations add MigrationName --project AiInstituteManager.Infrastructure --startup-project AiInstituteManager.API
~~~

### 3. Trust the development certificate

The Angular environment calls the API over HTTPS. If the certificate is not already
trusted, run:

~~~powershell
dotnet dev-certs https --trust
~~~

### 4. Start the backend

Recommended deterministic HTTPS launch, from backend:

~~~powershell
dotnet run --project AiInstituteManager.API --launch-profile https
~~~

The configured development URLs are:

- HTTPS API: https://localhost:7083
- HTTP API: http://localhost:5218
- Swagger: https://localhost:7083/swagger

The API uses HTTPS redirection. The frontend is configured to call the HTTPS URL
directly because redirecting a CORS preflight from HTTP is unreliable in browsers.

The backend helper scripts are also available from backend:

| Command | Purpose |
| --- | --- |
| npm start | Run HTTP and HTTPS profiles concurrently. |
| npm run start-http | Run HTTP only on port 5218. |
| npm run start-https | Run HTTPS only on port 7083. |
| npm run dev | Run dotnet run --project AiInstituteManager.API. |
| npm run build | Run dotnet build. |
| npm run test | Run dotnet test; no backend test project currently exists. |
| npm run db-migrate | Convenience migration command; use the explicit EF command above when tooling needs the project split. |

npm run db-reset is stale: it attempts to remove a SQLite file even though the
application uses SQL Server LocalDB. Do not use it as a LocalDB reset procedure.

### 5. Start the frontend

From FrontEnd:

~~~powershell
npm install
npm start
~~~

Open http://localhost:4200. The Angular environment in
FrontEnd/src/environments/environment.ts points to https://localhost:7083.
The API allows the frontend origin through Cors:AllowedOrigins, which defaults to
http://localhost:4200.

## Demo accounts

The API seeds these development accounts through ASP.NET Identity. Passwords are
hashed before storage and the seed operation is safe to repeat.

| Role | Email | Password |
| --- | --- | --- |
| Student | student@humber.ca | Student123! |
| Teacher | teacher@humber.ca | Teacher123! |
| Admin | admin@humber.ca | Admin123! |

These credentials are for local development only. The current registration endpoint
accepts a requested role, so role assignment must be restricted before production
deployment.

## End-to-end smoke workflow

1. Configure Jwt:Key and OpenAi:ApiKey.
2. Start the API and Angular dev server.
3. Sign in as teacher@humber.ca.
4. Open Quiz Generator, select a subject, enter a topic, choose difficulty and
   question count, then generate a draft.
5. Edit the draft and publish it.
6. Sign out and sign in as student@humber.ca.
7. Open Available quizzes, complete the published quiz, submit it, and verify the
   score and question feedback.
8. Sign in as admin@humber.ca and verify Admin Analytics Dashboard shows the quiz,
   attempt, and score data.

For API-only checks, use Swagger: call /api/auth/login, copy the returned token,
authorize Swagger with Bearer <token>, and then call the endpoints for that role.

## Testing and build commands

Run frontend commands from FrontEnd:

~~~powershell
npm run build
npm exec -- ng test --watch=false
~~~

The Angular test target uses Vitest. There is no npm test script in FrontEnd/package.json.

Run backend commands from backend:

~~~powershell
dotnet build
dotnet test
~~~

The solution currently contains API, Infrastructure, and Domain projects, but no
dedicated backend test project. dotnet test therefore does not provide backend
coverage until one is added.

## Configuration reference

The main configuration file is
backend/AiInstituteManager.API/appsettings.json:

| Key | Default/current behavior |
| --- | --- |
| ConnectionStrings:DefaultConnection | SQL Server LocalDB database AiInstituteManagerDb. |
| Cors:AllowedOrigins | http://localhost:4200. |
| Jwt:Key | Empty placeholder; provide through user secrets or deployment configuration. |
| Jwt:Issuer | AiInstituteManager.API. |
| Jwt:Audience | AiInstituteManager.Client. |
| Jwt:ExpiryMinutes | 60. |
| OpenAi:ApiKey | Empty placeholder; provide through user secrets or deployment configuration. |
| OpenAi:BaseUrl | Groq's OpenAI-compatible endpoint. |
| OpenAi:Model | openai/gpt-oss-20b. |
| OpenAi:ChunkSize | Optional; defaults to 5 in OpenAiSettings. |
| OpenAi:MaxAttempts | Optional; defaults to 3 in OpenAiSettings. |

For non-development environments, startup fails if Jwt:Key or OpenAi:ApiKey is
missing. Provide both values for a functional local login and AI-generation flow.

## Database model

The current EF Core model contains:

- User - ASP.NET Identity user with FullName and Role (Admin, Teacher, or Student).
- Subject - subject catalog entry with a unique code.
- Quiz - title, subject, teacher owner, publication state, and optional maximum
  attempts.
- Question - prompt, four answer options, and the correct A/B/C/D option.
- QuizResult - student/quiz relationship, percentage score, and completion time.

Migrations live in
backend/AiInstituteManager.Infrastructure/Migrations/. Entity relationship,
index, uniqueness, and delete behavior rules live in
backend/AiInstituteManager.Infrastructure/Data/Configurations/.

## Current limitations and roadmap

- The current local database is SQL Server LocalDB, not Azure SQL.
- The current AI configuration uses an OpenAI-compatible provider endpoint, not a
  deployed Azure OpenAI resource. The service seam can support a compatible provider
  through OpenAi:BaseUrl and OpenAi:Model.
- Backend attempt-limit support exists, but the Angular save model and editor do not
  currently expose MaxAttempts or display AttemptsUsed.
- Course and assignment pages are placeholders; no corresponding backend domain or
  API exists yet.
- The backend has no dedicated test project.
- Production hardening still needs controlled role assignment, production secret
  management, deployment configuration, and integration testing.

The technical blueprint, planned Azure architecture, and milestone roadmap are kept
in [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md). When the blueprint and current code
differ, use the code and this README for current runtime behavior.

## Important development rules

- Keep all database and AI access in the ASP.NET Core API; the Angular app must never
  connect directly to SQL Server or the AI provider.
- Keep AI-generated quizzes unpublished until a teacher reviews and approves them.
- Update matching C# contracts/entities and TypeScript models together when changing
  a persisted or API-facing shape.
- Use the existing repository/UnitOfWork and extension-method registration patterns
  when adding backend features.
- Add a new EF migration for schema changes and apply it before testing the API.

## Key files

- backend/AiInstituteManager.API/Program.cs - API startup, authentication,
  middleware, Swagger, and migration/seed hook.
- backend/AiInstituteManager.API/Controllers/ - authentication, quiz, student,
  admin, and subject endpoints.
- backend/AiInstituteManager.Infrastructure/AiGeneration/OpenAiService.cs - AI
  provider integration and response validation.
- backend/AiInstituteManager.Infrastructure/Data/ApplicationDbContext.cs - EF Core
  context and configuration discovery.
- backend/AiInstituteManager.Infrastructure/Data/Seed/SeedData.cs - demo users and
  subjects.
- FrontEnd/src/app/app.routes.ts - public, role-gated, and legacy routes.
- FrontEnd/src/app/core/services/ - frontend API clients and authentication state.
- FrontEnd/src/app/core/models/ - TypeScript models corresponding to backend shapes.
