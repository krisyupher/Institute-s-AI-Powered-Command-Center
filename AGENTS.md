# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## WHAT & WHY

Campus ERP MVP delivering an AI-powered Quiz/Exam Generator.

- **Teacher**: Generate, review/edit draft AI quizzes, and publish.
- **Student**: Take quizzes with instant auto-grading.
- **Admin**: View system-wide metrics.
- Target architecture: Angular SPA → ASP.NET Core API → Azure OpenAI & Azure SQL.

## REPOSITORY LAYOUT

```
FrontEnd/   Angular 22 SPA (standalone components, signals, lazy routes) — the npm root
backend/    .NET 10 solution (AiInstituteManager.slnx): API / Infrastructure / Domain
docs/       PROJECT_PLAN.md — the contract of record for schema, DTOs, endpoints
```

There is **no root `package.json`**. `FrontEnd/package.json` is the real npm project;
`backend/package.json` is a thin `npm run` wrapper around the dotnet commands below (see
the Backend commands note) — neither lives at the repo root.

## CURRENT STATE (read this before assuming a feature exists)

Auth is real and wired end to end; quiz/admin data is still mocked:

- **Auth is live.** [AuthController](backend/AiInstituteManager.API/Contollers/AuthController.cs)
  (`POST /api/auth/register`, `/login`, `GET /api/auth/me`) is implemented on top of
  ASP.NET Identity's `UserManager`/`SignInManager` + `JwtTokenService`, and
  `Program.cs` calls `await app.ApplyDbMigrationsAndSeedAsync();` on startup, so migrations
  run and demo accounts exist before the first request.
  [AuthService.login()](FrontEnd/src/app/core/services/auth.service.ts) makes a real
  `HttpClient.post` to `${environment.apiBaseUrl}/api/auth/login`; a functional
  [authInterceptor](FrontEnd/src/app/core/interceptors/auth.interceptor.ts) (registered in
  `app.config.ts`) attaches `Authorization: Bearer <token>` to every other outgoing
  request. `AuthService.session`/`isAuthenticated`/`role` are all `computed()` from
  decoding the JWT in `localStorage` (`core/auth/jwt.ts`) — there is no separate
  "logged in" flag to fall out of sync.
  - There is no mock-auth fallback and no demo role-switcher anymore — both were removed
    once real login shipped, because they fabricated a signed-in identity without ever
    calling the backend. `AuthService.login()` only ever succeeds via a real
    `POST /api/auth/login` against the database; any failure (bad credentials, unreachable
    API) propagates to the caller as a real error. `AuthService.setRole()` still exists but
    is a **test-only** helper now (mints a session locally so specs don't need to mock
    HTTP) — nothing in the production UI calls it.
  - CORS is configured via [CorsExtensions.cs](backend/AiInstituteManager.API/Extensions/CorsExtensions.cs)
    (`Cors:AllowedOrigins` in `appsettings.json`, defaults to `http://localhost:4200`).
    `environment.apiBaseUrl` points at the HTTPS profile (`https://localhost:7083`)
    directly rather than the HTTP one — the API calls `UseHttpsRedirection()`, so hitting
    HTTP just 307-redirects, and CORS preflights don't reliably survive a redirect.
- **Quiz and admin data are still fully mocked.** `QuizService`, `AdminService`, and
  `DashboardApi`
  ([quiz.service.ts](FrontEnd/src/app/core/services/quiz.service.ts),
  [admin.service.ts](FrontEnd/src/app/core/services/admin.service.ts),
  [dashboard.api.ts](FrontEnd/src/app/core/api/dashboard.api.ts)) all return
  `of(MOCK…).pipe(delay(250))` with no `HttpClient` calls. Method signatures deliberately
  match the endpoints in `docs/PROJECT_PLAN.md`, so wiring the real API means swapping the
  body for `this.http.*` with no caller changes — **preserve those signatures**.
- **The backend has controllers only for auth.** Quiz/admin endpoints from
  `docs/PROJECT_PLAN.md` (`/api/quiz/*`, `/api/admin/*`) and the Azure OpenAI integration
  are not implemented yet — Domain/Infrastructure (entities, EF configs, generic
  repository/UnitOfWork, seeding) are in place underneath where those controllers will go.
- **Most feature components are placeholders** rendering `<app-placeholder-page>`
  (teacher quiz generator/list, student quiz flows, admin dashboard page); the routing
  skeleton, layout shell, role guard, and login page are real.
- **`README.md` describes a different project layout** (`BackEnd/src/Institute.Api`,
  `DataBase/`, `Documentation/`, a Codex-backed AI assistant, SQLite). None of those paths
  exist here. Trust `docs/PROJECT_PLAN.md` and the code over the README.

## COMMANDS

### Frontend — run from `FrontEnd/`

| Command | Effect |
| --- | --- |
| `npm start` | Dev server on http://localhost:4200 |
| `npm run build` | Production build (budgets: 1 MB initial, 8 kB per component style) |

There are **no unit tests in this project**. Spec files were removed and generation is
disabled by default (`skipTests: true` under the component schematic in
[angular.json](FrontEnd/angular.json)); there is no `npm test`. Formatting comes from the
`prettier` block in [package.json](FrontEnd/package.json) (100 cols, single quotes) — there
is no `npm run format`.

### Backend — run from `backend/`

| Command | Effect |
| --- | --- |
| `dotnet build` | Builds all three projects |
| `dotnet run --project AiInstituteManager.API` | API on http://localhost:5218 (https 7083), Swagger at `/swagger` in Development |
| `dotnet ef migrations add <Name> --project AiInstituteManager.Infrastructure --startup-project AiInstituteManager.API` | New migration |
| `dotnet ef database update --project AiInstituteManager.Infrastructure --startup-project AiInstituteManager.API` | Apply migrations |

The `--project`/`--startup-project` split is mandatory: `ApplicationDbContext` lives in
Infrastructure while `Microsoft.EntityFrameworkCore.Design` is referenced by the API
startup project.

**There is no test project** — `dotnet test` finds nothing. Add one to the solution before
claiming backend test coverage.

Default connection string is SQL Server LocalDB
(`Server=(localdb)\mssqllocaldb;Database=AiInstituteManagerDb`), not Azure SQL yet.

`backend/package.json` wraps the above as `npm start`/`npm run build`/`npm run test`/
`npm run db-migrate`, so `README.md`'s "simple method" still works. Its `db-reset` script
(`rm -f AiInstituteManager.API/institute.db && dotnet ef database update`) is stale: it
targets a SQLite file left over from an earlier design, but the live connection string is
LocalDB, so the delete is a no-op — use `dotnet ef database update` (or drop the LocalDB
database) to actually reset state.

## ARCHITECTURE

### Backend — three projects, dependencies point inward

```
AiInstituteManager.API             Program.cs, Swagger, seeding hook  (net10.0, Web SDK)
   ↓
AiInstituteManager.Infrastructure  DbContext, EF configurations, migrations, repos, seed
   ↓
AiInstituteManager.Domain          entities + enums only — zero package references
```

Conventions that make new entities nearly free:

- Every entity derives from
  [BaseEntity](backend/AiInstituteManager.Domain/Common/BaseEntity.cs): `Id`, `CreatedAt`,
  and a private-setter `UpdatedAt` mutated only through `MarkAsUpdated()`.
- Domain classes hold **plain FK ints plus a nullable navigation property**. Cascade
  rules, indexes, uniqueness, and column types belong in
  `Infrastructure/Data/Configurations/*Configuration.cs`, never in the entity.
- `OnModelCreating` calls `ApplyConfigurationsFromAssembly`, so a new
  `IEntityTypeConfiguration<T>` is picked up automatically — do not edit the DbContext to
  register it.
- DI setup is hidden behind extension methods
  ([ServiceCollectionExtensions](backend/AiInstituteManager.Infrastructure/Extensions/ServiceCollectionExtensions.cs))
  so `Program.cs` stays a handful of lines. Follow that pattern instead of expanding
  `Program.cs`.
- `IGenericRepository<T>` is registered as an **open generic**, so every entity gets a
  repository from one line. `IUnitOfWork` exposes the five typed repositories and the
  single `SaveChangesAsync()`; write through the UnitOfWork, not the DbContext.
- Seeding is idempotent by an `AnyAsync()` guard per table
  ([DbInitializer](backend/AiInstituteManager.Infrastructure/Data/Seed/DbInitializer.cs)),
  so it is safe on every startup.

### Frontend

- **Standalone components only**, `ChangeDetectionStrategy.OnPush`, `inject()` over
  constructor injection, inline `template:` strings, signals for state.
- `provideRouter(routes, withComponentInputBinding())` — route params such as `:quizId`
  bind straight to component inputs; do not inject `ActivatedRoute` to read them.
- Auth state lives entirely in `AuthService`, derived from the JWT: the token is the only
  thing stored (`localStorage`, key `institute.jwt`), and `session`/`isAuthenticated`/
  `role`/`user` are all `computed()` off decoding it — never set independently. Outgoing
  requests get their `Authorization` header from the functional `authInterceptor`
  (registered via `provideHttpClient(withInterceptors([authInterceptor]))`), not from
  individual services.
- `core/` holds cross-cutting concerns (layout shell, guards, models, mock data, service
  clients); `features/` holds lazy-loaded pages; `shared/` holds reusable presentational
  pieces. Everything under `features/` is loaded with `loadComponent`; only the layout
  shell is eager.
- Routing shape: `/login` sits outside the shell; everything else is a child of
  `MainLayoutComponent`. Role-gated branches use `canActivate: [roleGuard('Teacher')]`,
  and a blocked user is redirected to the `ROLE_HOME` entry for their own role rather than
  bounced to login.
- Two dashboard generations coexist: `/dashboard/*`
  ([features/dashboard/](FrontEnd/src/app/features/dashboard/), fed by `DashboardApi` and
  the older `api.models.ts` shapes) and the quiz-feature routes `/teacher/*`,
  `/student/*`, `/admin/*` (fed by `QuizService`/`AdminService` and `quiz.model.ts`).
  **`api.models.ts` is the older contract** — it carries course/calendar/chat types with
  `string` ids and roles `'Administrator' | 'Staff'` that the quiz domain does not use.
  New quiz work belongs in `quiz.model.ts` / `user.model.ts` (numeric ids, roles
  `'Admin' | 'Teacher' | 'Student'`).
- Styling is Tailwind v4 CSS-first + DaisyUI v5, configured entirely in
  [styles.scss](FrontEnd/src/styles.scss) (`@import "tailwindcss"`, `@source "../app"`,
  `@plugin "daisyui"`) — **there is no `tailwind.config.js`**. Themes are limited to
  `corporate` (the shell theme) and `light`; adding a theme means editing the `@plugin`
  block. The `@source "../app"` line is what makes class extraction work inside inline
  templates.
- TypeScript is fully strict, including `strictTemplates` and
  `noPropertyAccessFromIndexSignature`.

## KEY GUIDELINES

- Direct database or AI access from the frontend is strictly forbidden. All requests flow
  through the ASP.NET Core API.
- Always maintain human-in-the-loop review for AI content — teachers must preview/edit
  generated quizzes before publishing. `Quiz.IsPublished` defaults to `false`; nothing
  should flip it implicitly.
- TypeScript models under `core/models/` mirror the C# entities one-for-one and document
  which file they mirror. Change both sides together.
- **For database schema, DTO shapes, API endpoints, or the milestone roadmap, consult
  [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).**
