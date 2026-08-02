# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state vs. the README

The root [README.md](README.md) describes the **target** system (`FrontEnd/`, `BackEnd/`,
`DataBase/`, `Documentation/`). Only `FrontEnd/` exists on disk today, and only the
dashboard feature is built. The backend, mock data, and documentation directories are not
written yet.

Because there is no API, the frontend runs on mocks:

- [dashboard.api.ts](FrontEnd/src/app/core/api/dashboard.api.ts) returns
  [dashboard.mock.ts](FrontEnd/src/app/core/mock/dashboard.mock.ts) via `of(...)` with a
  simulated delay. Its method signatures already match
  `GET /api/dashboard/{student|teacher|admin}` — swapping in `HttpClient` is a one-file
  change, and no component moves.
- [auth.service.ts](FrontEnd/src/app/core/auth/auth.service.ts) is a stand-in: the role is
  picked from the shell's dropdown and kept in `localStorage`, not decoded from a JWT. It
  exposes the real service's shape (`user`, `role`, `homeRoute`, `hasRole`) plus a demo-only
  `setRole`. There is no login screen, guard, or interceptor yet.
- [api.models.ts](FrontEnd/src/app/core/models/api.models.ts) mirrors the full backend DTO
  contract, including types nothing consumes yet — keep it as the single source of truth.
- Mock dates are generated relative to today, so the "next seven days" panels are never
  empty. Keep that property when editing the mock.
- `/courses/:id` and `/assignments` resolve to a "not built yet" placeholder so dashboard
  links don't dead-end. Replace those routes as the real pages land.

Treat the README as the spec to build toward, not a description of existing code. Do not
assume a file, service, or endpoint it mentions exists — check first.

Only `README.md` is tracked in git; `FrontEnd/` is still untracked.

## Commands

All frontend commands run from `FrontEnd/`:

```bash
npm install
npm start        # ng serve → http://localhost:4200
npm run build    # production build by default
npm run watch    # development build, rebuild on change
npm test         # ng test
```

Single test file: `npx ng test --include src/app/app.spec.ts`

The app opens on `/dashboard`, which redirects by role via `AuthService.homeRoute()`. Use
the role dropdown in the top bar to reach the teacher and admin dashboards.

There is **no linter configured** — no ESLint, no `lint` script. Formatting is Prettier
via the `prettier` key in [FrontEnd/package.json](FrontEnd/package.json) (100 cols, single
quotes, `angular` parser for `.html`) plus [FrontEnd/.editorconfig](FrontEnd/.editorconfig).
Run it with `npx prettier --write .`.

## Frontend conventions

- **Angular 21, standalone components only.** No NgModules. Providers go in
  [FrontEnd/src/app/app.config.ts](FrontEnd/src/app/app.config.ts); routes in
  [FrontEnd/src/app/app.routes.ts](FrontEnd/src/app/app.routes.ts) and should be lazy
  (`loadComponent`) per the README's intent.
- **Signals for component state** — the scaffold already uses `signal()`. Prefer signals
  over `BehaviorSubject` for view state; RxJS is present and appropriate for HTTP.
- **Test runner is Vitest**, not Karma — `angular.json` uses the `@angular/build:unit-test`
  builder and `tsconfig.spec.json` pulls in `vitest/globals`. `FrontEnd/README.md` is
  stock CLI boilerplate and still says Karma; ignore it.
- **TypeScript is strict**, including `noPropertyAccessFromIndexSignature` and
  `strictTemplates`. Index-signature access must use bracket notation.
- Styles are SCSS (`inlineStyleLanguage: scss`); the component schematic defaults to SCSS.
- Production build budgets: 500 kB initial warning / 1 MB error, 4 kB per-component style
  warning. Lazy routes matter for staying under these.

## Backend, when it is built

The README's architecture is binding on new work:

- Clean Architecture, dependencies inward only:
  `Api → Infrastructure → Application → Domain` (Domain has no dependencies).
- **AI tools never touch the database.** An `IAiTool` calls the same application services
  (`ICalendarService`, `ICourseService`, …) that REST controllers call, so an assistant
  action goes through identical authorization. Adding a capability = one new `IAiTool` plus
  registration, nothing else.
- `Ai:Provider` selects `offline` (default; deterministic intent matching, no key, no
  network) or `claude`. The offline provider exists to keep the `IAiProvider` abstraction
  honest — swapping providers must not change any tool, service, or frontend code.
- Times are wall-clock institution-local stored as UTC and rendered as UTC; don't "fix"
  this with local-timezone conversion without adding a per-institution timezone.
- Frontend expects the API at `http://localhost:5133`; CORS allows `http://localhost:4200`.
