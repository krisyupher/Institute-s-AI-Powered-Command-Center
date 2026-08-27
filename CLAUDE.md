# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## WHAT & WHY

Campus ERP MVP delivering an AI-powered Quiz/Exam Generator.

- **Teacher**: Generate, review/edit draft AI quizzes, and publish.
- **Student**: Take quizzes with instant auto-grading.
- **Admin**: View system-wide metrics.
- Architecture: Angular SPA → ASP.NET Core API → OpenAI-compatible REST API & SQL Server.

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

Every quiz/auth/admin feature is real and wired end to end against the database — **there
is no mock data or fallback anywhere in the frontend** (`core/mock/` was deleted). A down
or unreachable backend now surfaces as a real error in the UI, not a silently-served fake
response.

- **Auth is live.** [AuthController](backend/AiInstituteManager.API/Controllers/AuthController.cs)
  (`POST /api/auth/register`, `/login`, `GET /api/auth/me`) is implemented on top of
  ASP.NET Identity's `UserManager`/`SignInManager` + `JwtTokenService`, and
  `Program.cs` calls `await app.ApplyDbMigrationsAndSeedAsync();` on startup, so migrations
  run and demo accounts exist before the first request. Demo logins (seeded by
  [SeedData.cs](backend/AiInstituteManager.Infrastructure/Data/Seed/SeedData.cs)):
  `student@humber.ca` / `Student123!`, `teacher@humber.ca` / `Teacher123!`,
  `admin@humber.ca` / `Admin123!`.
  [AuthService.login()](FrontEnd/src/app/core/services/auth.service.ts) makes a real
  `HttpClient.post` to `${environment.apiBaseUrl}/api/auth/login`; a functional
  [authInterceptor](FrontEnd/src/app/core/interceptors/auth.interceptor.ts) (registered in
  `app.config.ts`) attaches `Authorization: Bearer <token>` to every other outgoing
  request. `AuthService.session`/`isAuthenticated`/`role` are all `computed()` from
  decoding the JWT in `localStorage` (`core/auth/jwt.ts`) — there is no separate
  "logged in" flag to fall out of sync. The app only ever authenticates through
  `login()`/`register()` against the database.
  - CORS is configured via [CorsExtensions.cs](backend/AiInstituteManager.API/Extensions/CorsExtensions.cs)
    (`Cors:AllowedOrigins` in `appsettings.json`, defaults to `http://localhost:4200`).
    `environment.apiBaseUrl` points at the HTTPS profile (`https://localhost:7083`)
    directly rather than the HTTP one — the API calls `UseHttpsRedirection()`, so hitting
    HTTP just 307-redirects, and CORS preflights don't reliably survive a redirect.
- **The full quiz lifecycle is live**, teacher and student sides both.
  [QuizController](backend/AiInstituteManager.API/Controllers/QuizController.cs)
  (`[Authorize(Roles = "Teacher,Admin")]`, route `api/quiz`) implements `POST /generate`
  (calls `IOpenAiService`), `POST /save` (create or, when `id` is supplied,
  replace-in-place — a teacher may only edit/delete quizzes they created, an admin may edit
  any), `GET /{id}`, `DELETE /{id}`, and `GET /my-quizzes`.
  [StudentQuizController](backend/AiInstituteManager.API/Controllers/StudentQuizController.cs)
  (`[Authorize(Roles = "Student")]`, same `api/quiz` route prefix) implements
  `GET /available` (published quizzes with correct answers withheld server-side — not just
  hidden client-side), `POST /submit` (grades against the DB's real answers, records a
  `QuizResult`, returns the score instantly), and `GET /results` (the calling student's own
  result history). [SubjectsController](backend/AiInstituteManager.API/Controllers/SubjectsController.cs)
  (`[Authorize]`, route `api/subjects`) implements `GET` for the subject catalog. Both new
  controllers are built against `IUnitOfWork`, matching the existing pattern.
  `POST /api/quiz/generate` calls out to an OpenAI-*compatible* REST API — see
  `OpenAiSettings` below; `docs/PROJECT_PLAN.md` says "Azure OpenAI" but the current
  implementation and `README.md` target **Groq's OpenAI-compatible endpoint**
  (`OpenAi:BaseUrl`/`OpenAi:ApiKey`/`OpenAi:Model` in `appsettings.json`, real values via
  `dotnet user-secrets` — never commit them). Without a working key, `POST /generate`
  fails (500) and the frontend now shows a real error — it no longer serves a synthesized
  fake draft.
  - [QuizService](FrontEnd/src/app/core/services/quiz.service.ts) calls every one of these
    routes directly with no `catchError` fallback. `getQuizById` is the one place with
    branching logic: it tries the teacher/admin `GET /api/quiz/{id}` first (has real
    correct answers, needed for editing) and, on any error — a student token gets a 403
    there — falls back to `GET /api/quiz/available` and picks the matching id; that's
    real-endpoint routing by role, not a mock fallback. `getDraftQuiz()` (used only when
    `/teacher/preview` is reached without router state, e.g. a hard refresh) derives the
    teacher's most recent unpublished quiz from the real `GET /api/quiz/my-quizzes` list
    rather than reading a hardcoded demo quiz.
- **Admin stats are live.** [AdminController](backend/AiInstituteManager.API/Controllers/AdminController.cs)
  (`[Authorize(Roles = "Admin")]`, route `api/admin`) implements `GET /stats` (total users,
  total quizzes, average score across `QuizResults`) and `GET /quizzes` (every quiz with
  question/attempt/average-score stats and the owning teacher's name, for the admin
  all-quizzes view).
  [AdminService.getAdminStats()](FrontEnd/src/app/core/services/admin.service.ts) calls it
  directly; errors are surfaced through
  [AdminDashboardComponent](FrontEnd/src/app/features/admin/dashboard/admin-dashboard.component.ts)'s
  own `loading`/`error` signals.
- **Every feature page is real** (generator → preview → publish, quiz list, take-quiz,
  available-quizzes, results, admin dashboard) — none are `<app-placeholder-page>` stubs
  anymore. The canonical admin page is
  `features/admin/dashboard/admin-dashboard.component.ts` at `/admin/dashboard`;
  `admin-dashboard-page.component.ts` in the same folder is now just a compatibility
  re-export of that component (kept for older imports — its own spec file still asserts the
  old "coming soon" placeholder text and currently fails, see COMMANDS). The only remaining
  orphaned dead code is the entire `features/dashboard/admin-dashboard/` folder (an older
  mock-era dashboard, not imported by `app.routes.ts` — the `/dashboard/admin` route just
  redirects to `/admin/dashboard`); it can be deleted or revived freely.
- **`README.md`** now matches this repository's actual layout, commands, and demo accounts
  — trust it alongside `docs/PROJECT_PLAN.md` and the code. `docs/PROJECT_PLAN.md` is
  still the contract of record for schema/DTOs/endpoints, but note the Azure OpenAI vs.
  Groq divergence above, and that it predates the `/api/quiz/results` and `/api/subjects`
  endpoints.

## COMMANDS

### Frontend — run from `FrontEnd/`

| Command | Effect |
| --- | --- |
| `npm start` | Dev server on http://localhost:4200 |
| `npm run build` | Production build (budgets: 1 MB initial, 8 kB per component style) |

Unit tests exist for a subset of components/services and run on **Vitest** through the
Angular CLI's `unit-test` builder (`architect.test` in
[angular.json](FrontEnd/angular.json), `tsConfig: tsconfig.spec.json`). There is no
`npm test` script — run them with `npx ng test --watch=false` (drop the flag to keep Vitest
in watch mode). New components generated via the CLI schematic do **not** get a spec by
default (`skipTests: true` under `schematics."@schematics/angular:component"` in
`angular.json`) — add `*.component.spec.ts` by hand when a component needs coverage. As of
this writing 3 of ~65 tests fail on `main`: two `sidebar.component.spec.ts` cases expect a
nav list without the "Dashboard" entry that's since been added, and
`admin-dashboard-page.component.spec.ts` still expects the old placeholder copy now that the
component re-exports the live admin dashboard (see CURRENT STATE) — treat these as stale
specs to fix, not regressions to chase. Formatting comes from the `prettier` block in
[package.json](FrontEnd/package.json) (100 cols, single quotes) — there is no
`npm run format`.

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

`backend/package.json` wraps the above as `npm start` (runs HTTP :5218 and HTTPS :7083
concurrently), `npm run start-http`/`start-https` (one profile only), `npm run build`,
`npm run test` (`dotnet test` — still finds nothing, see above), and `npm run db-migrate`
(`dotnet ef database update --project AiInstituteManager.API`, no explicit
`--startup-project`). Its `db-reset` script (`rimraf AiInstituteManager.API/institute.db &&
dotnet ef database update`) is stale: it targets a SQLite file left over from an earlier
design, but the live connection string is LocalDB, so the delete is a no-op — use
`dotnet ef database update` (or drop the LocalDB database) to actually reset state.

Secrets (`Jwt:Key`, `OpenAi:ApiKey`) are never committed — `appsettings.json` has empty
placeholders; set real values with `dotnet user-secrets` from
`backend/AiInstituteManager.API` (see `README.md` for the exact commands). `Program.cs`
throws on startup in non-Development environments if either is missing.

## ARCHITECTURE

### Backend — three projects, dependencies point inward

```
AiInstituteManager.API             Program.cs, Controllers/, Swagger, seeding hook  (net10.0, Web SDK)
   ↓
AiInstituteManager.Infrastructure  DbContext, EF configurations, migrations, repos, seed, AiGeneration/
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
  ([ServiceCollectionExtensions](backend/AiInstituteManager.Infrastructure/Extensions/ServiceCollectionExtensions.cs)
  for DbContext/Identity/JWT/OpenAI HttpClient/repos,
  [CorsExtensions](backend/AiInstituteManager.API/Extensions/CorsExtensions.cs) for CORS)
  so `Program.cs` stays a handful of lines. Follow that pattern instead of expanding
  `Program.cs`.
- `IGenericRepository<T>` is registered as an **open generic**, so every entity gets a
  repository from one line. `IUnitOfWork` exposes the five typed repositories and the
  single `SaveChangesAsync()`; write through the UnitOfWork, not the DbContext.
- `IOpenAiService`/`OpenAiService` ([AiGeneration/](backend/AiInstituteManager.Infrastructure/AiGeneration/))
  is registered via `AddHttpClient<IOpenAiService, OpenAiService>` — one pooled,
  DI-managed `HttpClient` with base address and `Authorization: Bearer <OpenAi:ApiKey>`
  set once from `OpenAiSettings`, not per call.
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
- `core/` holds cross-cutting concerns (layout shell, guards, models, service clients);
  `features/` holds lazy-loaded pages; `shared/` holds reusable presentational pieces.
  Everything under `features/` is loaded with `loadComponent`; only the layout shell is
  eager.
- Routing shape: `/login` and `/register` sit outside the shell; everything else is a
  child of `MainLayoutComponent`. Role-gated branches use
  `canActivate: [roleGuard('Teacher')]` / `roleGuard('Admin')`, and a blocked user is
  redirected to the `ROLE_HOME` entry for their own role rather than bounced to login.
- Two dashboard generations coexist: `/dashboard/*`
  ([features/dashboard/](FrontEnd/src/app/features/dashboard/), fed by the older
  `api.models.ts` shapes) and the quiz-feature routes `/teacher/*`, `/student/*`,
  `/admin/*` (fed by `QuizService`/`AdminService` and `quiz.model.ts`).
  **`api.models.ts` is the older contract** — it carries course/calendar/chat types with
  `string` ids and roles `'Administrator' | 'Staff'` that the quiz domain does not use.
  New quiz work belongs in `quiz.model.ts` / `user.model.ts` (numeric ids, roles
  `'Admin' | 'Teacher' | 'Student'`). The admin branch of `/dashboard/*` is now dead
  (`/dashboard/admin` just redirects to the canonical `/admin/dashboard`) — see CURRENT
  STATE above for the orphaned files this left behind.
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
- There is no mock data in the frontend — every service method calls its real backend
  route and lets errors propagate; components handle them via their own `loading`/`error`
  signals. Don't reintroduce a `catchError`-to-mock fallback for new work.
- **For database schema, DTO shapes, API endpoints, or the milestone roadmap, consult
  [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)** — but check CURRENT STATE first for where
  the live implementation has already diverged from it (Groq vs. Azure OpenAI; endpoints
  not yet built).
