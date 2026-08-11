import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { decodeSession, mintMockToken } from '../auth/jwt';
import { MOCK_USERS } from '../mock/mock-data';
import { LoginRequest, LoginResponse, sessionToUser } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';

/** localStorage key holding the raw JWT. */
export const TOKEN_KEY = 'institute.jwt';

/** Latency the mock-auth fallback simulates, matching the other mock services. */
const MOCK_LATENCY_MS = 250;

/** Rendered by the shell while signed out, so the header never shows a stale identity. */
const GUEST: User = {
  id: 0,
  fullName: 'Guest',
  email: '',
  role: 'Student',
  createdAt: new Date(0).toISOString(),
  updatedAt: null,
};

/** Where each role belongs after signing in. */
const ROLE_HOME: Record<UserRole, string> = {
  Student: '/dashboard/student',
  Teacher: '/dashboard/teacher',
  Admin: '/dashboard/admin',
};

/**
 * Ticket 2.3: owns the signed-in user's state and the JWT.
 *
 * The token in `localStorage` is the single source of truth — identity is decoded from
 * its claims rather than tracked separately, so a page reload restores the session and an
 * expired token reads as signed out with no extra bookkeeping.
 *
 * `token()` is what `authInterceptor` reads to build the `Authorization` header; nothing
 * else in the app should touch `localStorage` for auth.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly rawToken = signal<string | null>(readStoredToken());

  /** The raw JWT, or `null` when signed out. Read by `authInterceptor`. */
  readonly token = this.rawToken.asReadonly();

  /** Claims of the current token; `null` when absent, malformed, or expired. */
  readonly session = computed(() => decodeSession(this.rawToken()));

  readonly isAuthenticated = computed(() => this.session() !== null);

  readonly role = computed<UserRole>(() => this.session()?.role ?? 'Student');

  readonly user = computed<User>(() => {
    const session = this.session();
    return session ? sessionToUser(session) : GUEST;
  });

  /** Where a signed-in user belongs, derived from their role. */
  readonly homeRoute = computed(() => ROLE_HOME[this.role()]);

  hasRole(...roles: UserRole[]): boolean {
    return this.isAuthenticated() && roles.includes(this.role());
  }

  /**
   * `POST /api/auth/login`. On success the returned JWT is stored and the session state
   * updates immediately.
   *
   * While `environment.useMockAuth` is on, a transport-level failure (the endpoint does
   * not exist until backend Ticket 2.2) falls back to a locally minted mock token so the
   * app remains usable. Credential rejections (401/400) are never faked — those are a
   * real answer from a real API.
   */
  login(credentials: LoginRequest): Observable<User> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/api/auth/login`, credentials)
      .pipe(
        map((response) => response.token),
        catchError((error: HttpErrorResponse) => {
          if (environment.useMockAuth && isEndpointUnavailable(error)) {
            return mockLogin(credentials);
          }
          return throwError(() => error);
        }),
        tap((token) => this.storeToken(token)),
        map(() => this.user()),
      );
  }

  /** Clears the token; the session, role and `isAuthenticated` all follow from it. */
  logout(): void {
    this.storeToken(null);
  }

  /** Returns the currently signed-in user, or `null` when signed out. */
  getCurrentUser(): Observable<User | null> {
    return of(this.isAuthenticated() ? this.user() : null);
  }

  /**
   * Demo affordance kept from the shell: signs in as the mock user for `role` without a
   * login round-trip, so the header's role switch keeps working before the login UI
   * (Ticket 2.5) and the backend auth endpoints exist. It mints a real session rather
   * than faking a flag, so guards and the interceptor exercise the same code path as a
   * genuine sign-in.
   */
  setRole(role: UserRole): void {
    const user = MOCK_USERS.find((candidate) => candidate.role === role);
    this.storeToken(user ? mintMockToken(user) : null);
  }

  private storeToken(token: string | null): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.rawToken.set(token);
  }
}

function readStoredToken(): string | null {
  // Guard the read: a corrupt or expired value should read as "signed out", not throw
  // during service construction.
  const token = localStorage.getItem(TOKEN_KEY);
  return token && decodeSession(token) ? token : null;
}

/**
 * True when the request never reached a working endpoint — the API is down (status 0) or
 * the route does not exist yet (404). A 401/400 means the API answered, so it stands.
 */
function isEndpointUnavailable(error: HttpErrorResponse): boolean {
  return error.status === 0 || error.status === 404;
}

/** Dev-only stand-in for `POST /api/auth/login`; emits a mock JWT for the given email. */
function mockLogin(credentials: LoginRequest): Observable<string> {
  const user = MOCK_USERS.find(
    (candidate) => candidate.email.toLowerCase() === credentials.email.trim().toLowerCase(),
  );
  if (!user) {
    return throwError(() => new Error('Invalid email or password.'));
  }
  return of(mintMockToken(user)).pipe(delay(MOCK_LATENCY_MS));
}
