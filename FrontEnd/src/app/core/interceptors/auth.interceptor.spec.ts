import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService, TOKEN_KEY } from '../services/auth.service';
import { mintMockToken } from '../auth/jwt';

const TOKEN = mintMockToken({
  id: 1,
  fullName: 'Elena Rivera',
  email: 'e.rivera@institute.edu',
  role: 'Teacher',
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  /** Ticket 2.3 acceptance criteria. */
  it('attaches the Bearer token to an outgoing request', () => {
    TestBed.inject(AuthService).setRole('Teacher');

    http.get('/api/quiz/available').subscribe();

    const request = backend.expectOne('/api/quiz/available');
    expect(request.request.headers.get('Authorization')).toBe(
      `Bearer ${TestBed.inject(AuthService).token()}`,
    );
    request.flush([]);
  });

  it('attaches the token stored by a previous session on reload', () => {
    localStorage.setItem(TOKEN_KEY, TOKEN);

    http.post('/api/quiz/save', {}).subscribe();

    const request = backend.expectOne('/api/quiz/save');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
    request.flush({});
  });

  it('sends no Authorization header when signed out', () => {
    http.get('/api/quiz/available').subscribe();

    const request = backend.expectOne('/api/quiz/available');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('stops attaching the token after logout', () => {
    const auth = TestBed.inject(AuthService);
    auth.setRole('Student');
    auth.logout();

    http.get('/api/quiz/available').subscribe();

    const request = backend.expectOne('/api/quiz/available');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it.each(['/api/auth/login', '/api/auth/register'])(
    'leaves %s unauthenticated even with a token',
    (url) => {
      TestBed.inject(AuthService).setRole('Admin');

      http.post(url, {}).subscribe({ error: () => undefined });

      const request = backend.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    },
  );

  it('does not overwrite an Authorization header set by the caller', () => {
    TestBed.inject(AuthService).setRole('Admin');

    http.get('/api/admin/stats', { headers: { Authorization: 'Bearer caller-supplied' } }).subscribe();

    const request = backend.expectOne('/api/admin/stats');
    expect(request.request.headers.get('Authorization')).toBe('Bearer caller-supplied');
    request.flush({});
  });
});
