import {Routes} from '@angular/router';

import {MainLayoutComponent} from './core/layout/main-layout/main-layout.component';
import {roleGuard} from './core/guards/role.guard';
import {authGuard} from './core/guards/auth.guard';

// 'login' route is outside the main layout shell
// All other routes inside MainLayout (router outlet + header/sidebar)
// Feature pages use lazy loading (loadComponent) to save bundle space
// Shell components load upfront since they appear on every page
export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Create account',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {path: '', pathMatch: 'full', redirectTo: 'dashboard'},

      {
        path: 'teacher',
        canActivate: [roleGuard('Teacher')],
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
          {
            path: 'preview',
            title: 'Preview quiz',
            loadComponent: () =>
              import('./features/teacher/quiz-preview/quiz-preview.component').then(
                (m) => m.QuizPreviewComponent,
              ),
          },
          {
            // Edit mode: loads the quiz identified by :quizId into the editor.
            path: 'preview/:quizId',
            title: 'Edit quiz',
            loadComponent: () =>
              import('./features/teacher/quiz-preview/quiz-preview.component').then(
                (m) => m.QuizPreviewComponent,
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
        canActivate: [roleGuard('Admin')],
        children: [
          {path: '', pathMatch: 'full', redirectTo: 'dashboard'},
          {
            path: 'dashboard',
            title: 'Admin dashboard',
            loadComponent: () =>
              import('./features/admin/dashboard/admin-dashboard.component').then(
                (m) => m.AdminDashboardComponent,
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
              import('./features/dashboard/student-dashboard/student-dashboard.component').then(
                (m) => m.StudentDashboardComponent,
              ),
          },
          {
            path: 'teacher',
            title: 'Teacher dashboard',
            canActivate: [roleGuard('Teacher')],
            loadComponent: () =>
              import('./features/dashboard/teacher-dashboard/teacher-dashboard.component').then(
                (m) => m.TeacherDashboardComponent,
              ),
          },
          // Legacy route retained for bookmarks; the canonical admin page is /admin/dashboard.
          {path: 'admin', pathMatch: 'full', redirectTo: '/admin/dashboard'},
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
