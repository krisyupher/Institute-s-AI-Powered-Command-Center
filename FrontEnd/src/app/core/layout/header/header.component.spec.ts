import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';

function signOutButton(fixture: ComponentFixture<HeaderComponent>): HTMLButtonElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector('button');
}

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideRouter([{ path: 'login', component: HeaderComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
  });

  it('hides the sign-out button for a signed-out guest', () => {
    expect(signOutButton(fixture)).toBeNull();
  });

  it('shows sign-out once signed in, and it clears the session and redirects to /login', () => {
    TestBed.inject(AuthService).setRole('Teacher');
    fixture.detectChanges();

    const button = signOutButton(fixture);
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('Sign out');

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const auth = TestBed.inject(AuthService);

    button!.click();

    expect(auth.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
