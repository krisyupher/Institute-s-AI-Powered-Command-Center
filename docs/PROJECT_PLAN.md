# AI Manager for Institutes - Technical Blueprint

## 1. Domain Entities & Database Schema (EF Core Code-First)
- **User**: `Id`, `FullName`, `Email`, `Role` (`Admin` | `Teacher` | `Student`)
- **Subject**: `Id`, `Name`, `Code`
- **Quiz**: `Id`, `Title`, `SubjectId` (FK), `CreatedByTeacherId` (FK), `CreatedAt`, `IsPublished`
- **Question**: `Id`, `QuizId` (FK), `Text`, `OptionA`, `OptionB`, `OptionC`, `OptionD`, `CorrectAnswer`
- **QuizResult**: `Id`, `QuizId` (FK), `StudentId` (FK), `Score`, `CompletedAt`

---

## 2. API Endpoints Contract

### Authentication (`/api/auth`)
- `POST /login`: Validates credentials, returns JWT with User ID, Name, and Role claims.
- `POST /register`: Seeds default test accounts.

### Quiz Management (`/api/quiz`)
- `POST /generate`: Takes topic, difficulty, question count; calls Azure OpenAI REST API; returns raw question DTOs.
- `POST /save`: Saves teacher-approved/edited quiz and questions to SQL Server.
- `GET /available`: Lists published quizzes for students.
- `POST /submit`: Accepts student answers, evaluates correct options, returns score, and records `QuizResult`.

### Admin Metrics (`/api/admin`)
- `GET /stats`: Returns total users, total AI-generated quizzes, and global average score.

---

## 3. UI Shells & Navigation Breakdown
- **Teacher Shell**: Generator form (topic/difficulty/count), editable draft preview cards, quiz list, student scores view.
- **Student Shell**: Available quiz list, step-by-step quiz component with timer, immediate score feedback view.
- **Admin Shell**: Metric summary widgets (total users, quiz counts, average scores).

---

## 4. Implementation Roadmap Summary
- Repos initialization, EF Core models, initial migration.
- JWT authentication, backend CORS, Angular `AuthInterceptor` & `RoleGuard`, base layouts.
- OpenAI REST service integration (`OpenAiService.cs`), Quiz generator UI & preview editor.
- Student quiz runner, backend auto-grading engine, Admin stats dashboard.
- Azure SQL & App Service deployment, integration testing, postman collection, presentation prep.