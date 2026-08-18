import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';
import { mintMockToken } from '../../../core/auth/jwt';
import { environment } from '../../../../environments/environment';

const TEACHER = { id: 1, fullName: 'Elena Rivera', email: 'e.rivera@institute.edu', role: 'Teacher' as const };

function fillForm(fixture: ComponentFixture<LoginComponent>, email: string, password: string): void {
  const el = fixture.nativeElement as HTMLElement;
  const emailInput = el.querySelector<HTMLInputElement>('input[type="email"]')!;
  const passwordInput = el.querySelector<HTMLInputElement>('input[type="password"]')!;
  emailInput.value = email;
  emailInput.dispatchEvent(new Event('input'));
  passwordInput.value = password;
  passwordInput.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submitForm(fixture: ComponentFixture<LoginComponent>): void {
  (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let backend: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: LoginComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('rejects an empty submission without calling the API', () => {
    submitForm(fixture);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Email is required.');
    expect(text).toContain('Password is required.');
    backend.expectNone(`${environment.apiBaseUrl}/api/auth/login`);
  });

  it('flags an invalid email without calling the API', () => {
    fillForm(fixture, 'not-an-email', 'Teacher123!');
    submitForm(fixture);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Enter a valid email address.',
    );
    backend.expectNone(`${environment.apiBaseUrl}/api/auth/login`);
  });

  it('submits credentials to AuthService.login() and redirects to the role home route', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fillForm(fixture, TEACHER.email, 'Teacher123!');

    submitForm(fixture);

    const request = backend.expectOne(`${environment.apiBaseUrl}/api/auth/login`);
    expect(request.request.body).toEqual({ email: TEACHER.email, password: 'Teacher123!' });
    request.flush({ token: mintMockToken(TEACHER), email: TEACHER.email, role: TEACHER.role });
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith('/dashboard/teacher');
  });

  it('shows the server message and stays on the page when credentials are rejected', () => {
    fillForm(fixture, TEACHER.email, 'wrong-password');
    submitForm(fixture);

    backend
      .expectOne(`${environment.apiBaseUrl}/api/auth/login`)
      .flush({ message: 'Invalid email or password.' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Invalid email or password.',
    );
  });
});
