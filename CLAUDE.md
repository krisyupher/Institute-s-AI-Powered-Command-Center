# AI Manager for Institutes

## WHAT & WHY
Campus ERP MVP delivering an AI-powered Quiz/Exam Generator.
- **Teacher**: Generate, review/edit draft AI quizzes, and publish.
- **Student**: Take quizzes with instant auto-grading.
- **Admin**: View system-wide metrics.
- Architecture: Angular SPA → ASP.NET Core API → Azure OpenAI & Azure SQL.

## TECH STACK
- **Frontend**: Angular 22, Tailwind CSS 4, DaisyUI 5, Vitest
- **Backend**: C# / ASP.NET Core 8 Web API, EF Core 8 (Code-First), JWT Auth

## COMMANDS

### Frontend (`/frontend` or root package.json)
- `npm start` - Run dev server (http://localhost:4200)
- `npm run build` - Production build
- `npm test` - Run unit tests (Vitest)

### Backend (`/backend/AIManager.API`)
- `dotnet run` - Start API server
- `dotnet build` - Build backend project
- `dotnet test` - Run C# tests
- `dotnet ef database update` - Apply EF Core migrations

## KEY GUIDELINES
- Direct database or AI access from the frontend is strictly forbidden. All requests flow through the ASP.NET Core API.
- Always maintain human-in-the-loop review for AI content (Teachers must preview/edit generated quizzes before publishing).
- Follow existing Angular standalone component patterns and DaisyUI/Tailwind utility classes for UI styling.
- **For database schemas, DTO structures, API endpoints, or weekly milestones, refer to `docs/PROJECT_PLAN.md`.**