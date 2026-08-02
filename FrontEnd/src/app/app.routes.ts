import {Routes} from '@angular/router';

import {MainLayoutComponent} from './core/layout/main-layout/main-layout.component';

/**
 * Routing table.
 *
 * `login` sits outside the shell. Everything else is a child of `MainLayoutComponent`
 * (the Ticket 1.4 shell: header + sidebar + router outlet) whose paths are declared
 * relative to the empty parent. Feature pages are lazy (`loadComponent`) so each is its
 * own chunk and stays inside the production bundle budget; the shell itself is eager
 * since every authenticated view renders inside it.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {path: '', pathMatch: 'full', redirectTo: 'dashboard'},

      {
        path: 'teacher',
        children: [
          {path: '', pathMatch: 'full', redirectTo: 'quizzes'},
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
          {path: '', pathMatch: 'full', redirectTo: 'quizzes'},
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
          {path: '', pathMatch: 'full', redirectTo: 'dashboard'},
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
    ],
  },

  {path: '**', redirectTo: 'dashboard'},
];
