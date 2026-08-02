import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
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
    loadComponent: () =>
      import('./shared/not-built.component').then((m) => m.NotBuiltComponent),
  },
  {
    path: 'assignments',
    loadComponent: () =>
      import('./shared/not-built.component').then((m) => m.NotBuiltComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
