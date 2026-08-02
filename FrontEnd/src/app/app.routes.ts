import { Routes } from '@angular/router';

/**
 * Ticket 1.5 routing table.
 *
 * Every page is lazy (`loadComponent`) so each feature is its own chunk and the initial
 * bundle stays inside the production budget. Routes are declared flat rather than nested
 * under a layout component: FE1's `MainLayoutComponent` (Ticket 1.4) is not in yet, and
 * these routes render into the `<router-outlet>` already present in `app.html`. When the
 * shell lands, wrap the authenticated routes in a parent `{ path: '', component:
 * MainLayoutComponent, children: [...] }` — the child paths below do not need to change.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'login',
    title: 'Sign in',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'teacher',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'quizzes' },
      {
        path: 'generator',
        title: 'Quiz generator',
        loadComponent: () =>
          import('./features/teacher/quiz-generator/quiz-generator.component').then(
            (m) => m.QuizGeneratorComponent,
          ),
      },
      {
        path: 'quizzes',
        title: 'My quizzes',
        loadComponent: () =>
          import('./features/teacher/quiz-list/quiz-list.component').then(
            (m) => m.QuizListComponent,
          ),
      },
    ],
  },

  {
    path: 'student',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'quizzes' },
      {
        path: 'quizzes',
        title: 'Available quizzes',
        loadComponent: () =>
          import('./features/student/available-quizzes/available-quizzes.component').then(
            (m) => m.AvailableQuizzesComponent,
          ),
      },
      {
        // Taking a specific quiz. `quizId` binds straight to the component input.
        path: 'quizzes/:quizId',
        title: 'Take quiz',
        loadComponent: () =>
          import('./features/student/take-quiz/take-quiz.component').then(
            (m) => m.TakeQuizComponent,
          ),
      },
      {
        path: 'results',
        title: 'My results',
        loadComponent: () =>
          import('./features/student/quiz-result/quiz-result.component').then(
            (m) => m.QuizResultComponent,
          ),
      },
    ],
  },

  {
    path: 'admin',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Admin dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard-page.component').then(
            (m) => m.AdminDashboardPageComponent,
          ),
      },
    ],
  },

  // --- Existing dashboard feature (built, mock-backed) ---
  {
    path: 'dashboard',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/dashboard-redirect.component').then(
            (m) => m.DashboardRedirectComponent,
          ),
      },
      {
        path: 'student',
        title: 'Student dashboard',
        loadComponent: () =>
          import('./features/dashboard/student-dashboard.component').then(
            (m) => m.StudentDashboardComponent,
          ),
      },
      {
        path: 'teacher',
        title: 'Teacher dashboard',
        loadComponent: () =>
          import('./features/dashboard/teacher-dashboard.component').then(
            (m) => m.TeacherDashboardComponent,
          ),
      },
      {
        path: 'admin',
        title: 'Institution overview',
        loadComponent: () =>
          import('./features/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
    ],
  },

  // Targets of links inside the dashboards; real pages are not built yet.
  {
    path: 'courses/:courseId',
    loadComponent: () => import('./shared/not-built.component').then((m) => m.NotBuiltComponent),
  },
  {
    path: 'assignments',
    loadComponent: () => import('./shared/not-built.component').then((m) => m.NotBuiltComponent),
  },

  { path: '**', redirectTo: 'dashboard' },
];
