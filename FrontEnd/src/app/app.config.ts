import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `withComponentInputBinding` lets route params (e.g. `:quizId`) bind straight to
    // component inputs, so pages don't have to inject ActivatedRoute to read them.
    provideRouter(routes, withComponentInputBinding()),
    // Ticket 2.3: registering `authInterceptor` here is what makes every outgoing request
    // carry `Authorization: Bearer <token>` without any service opting in.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
