import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `withComponentInputBinding` lets route params (e.g. `:quizId`) bind straight to
    // component inputs, so pages don't have to inject ActivatedRoute to read them.
    provideRouter(routes, withComponentInputBinding()),
  ],
};
