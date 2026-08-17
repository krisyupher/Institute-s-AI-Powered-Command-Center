/**
 * Ticket 2.3: attaches `Authorization: Bearer <token>` to outgoing requests.
 *
 * Functional interceptor, registered once in `app.config.ts` via
 * `provideHttpClient(withInterceptors([authInterceptor]))`. Because it sits in the
 * `HttpClient` pipeline, every service gets the header for free — no service ever builds
 * an auth header itself.
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

/**
 * Endpoints that must go out unauthenticated. Sending a stale token to `/login` would
 * make the API's own credential check ambiguous.
 */
const ANONYMOUS_PATHS = ['/api/auth/login', '/api/auth/register'];

function isAnonymous(url: string): boolean {
  return ANONYMOUS_PATHS.some((path) => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();

  // Leave the request untouched when there is nothing to attach, when the endpoint is
  // deliberately anonymous, or when a caller has already set its own header.
  if (!token || isAnonymous(req.url) || req.headers.has('Authorization')) {
    return next(req);
  }

  // `HttpRequest` is immutable — `clone` is the only way to add the header.
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
