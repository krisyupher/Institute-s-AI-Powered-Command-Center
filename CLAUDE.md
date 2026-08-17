# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

There is **no root `package.json`**. All npm commands run from `FrontEnd/`; all dotnet
commands run from `backend/`.

## CURRENT STATE (read this before assuming a feature exists)

The two halves are not yet connected, and each is only partly built:

- **No HTTP calls anywhere in the frontend.** Every "client" service
  ([auth.service.ts](FrontEnd/src/app/core/services/auth.service.ts),
  [quiz.service.ts](FrontEnd/src/app/core/services/quiz.service.ts),
  [admin.service.ts](FrontEnd/src/app/core/services/admin.service.ts),
  [dashboard.api.ts](FrontEnd/src/app/core/api/dashboard.api.ts)) returns
  `of(MOCK…).pipe(delay(250))`. Method signatures deliberately match the endpoints in
  `docs/PROJECT_PLAN.md` so wiring the real API means swapping the body for `this.http.*`
  with no caller changes — **preserve those signatures**.
- **The backend has no controllers, no auth, and no AI service.** It is currently
  DbContext + entity configurations + generic repository/UnitOfWork + seeding.
  `AddInfrastructure` and `MapControllers` are wired, but there is nothing to map yet.
- **Seeding is written but not invoked.** `ApplyMigrationsAndSeedAsync` exists in
  [DatabaseSeedingExtensions.cs](backend/AiInstituteManager.API/Extensions/DatabaseSeedingExtensions.cs)
  and is not called from [Program.cs](backend/AiInstituteManager.API/Program.cs). Adding
  `await app.ApplyMigrationsAndSeedAsync();` after `var app = builder.Build();` is the
  intended hook-up.
- **Most feature components are placeholders** rendering `<app-placeholder-page>`; the
  routing skeleton, layout shell, and role guard are real.
- `AuthService.isAuthenticated` is hardcoded `true` and the "role" is a value in
  `localStorage` (`institute.mockRole`) switched from the header — a demo affordance, not
  authentication. `roleGuard` is real logic sitting on top of that stub.
- **`README.md` describes a different project** (`BackEnd/src/Institute.Api`, `DataBase/`,
  `Documentation/`, a Claude-backed AI assistant, SQLite). None of those paths exist here.
  Trust `docs/PROJECT_PLAN.md` and the code over the README.

## COMMANDS

### Frontend — run from `FrontEnd/`

| Command | Effect |
| --- | --- |
| `npm start` | Dev server on http://localhost:4200 |
| `npm run build` | Production build (budgets: 1 MB initial, 8 kB per component style) |
| `npm test` | Unit tests — `@angular/build:unit-test` builder, vitest runner, jsdom |
| `npx ng test --include src/app/core/guards/role.guard.spec.ts` | Run one spec file |
| `npx ng test --filter "^roleGuard"` | Run tests whose suite/test name matches a regex |
| `npx ng test --watch` | Watch mode |

There is **no vitest.config.ts and no lint target**. Vitest is driven entirely by the
Angular builder in [angular.json](FrontEnd/angular.json); `tsconfig.spec.json` supplies
`vitest/globals`, so specs use `describe`/`it`/`expect` without imports. Formatting comes
from the `prettier` block in [package.json](FrontEnd/package.json) (100 cols, single
quotes) — there is no `npm run format`.

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
