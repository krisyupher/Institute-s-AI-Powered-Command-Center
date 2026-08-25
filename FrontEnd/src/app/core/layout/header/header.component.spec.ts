import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

const TEACHER: User = {
  id: 1,
  fullName: 'Elena Rivera',
  email: 'teacher@humber.ca',
  role: 'Teacher',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

function setup(overrides: Partial<{ user: User; isAuthenticated: boolean }> = {}) {
  const fakeAuth = {
    user: signal(overrides.user ?? TEACHER),
    role: signal((overrides.user ?? TEACHER).role),
    isAuthenticated: signal(overrides.isAuthenticated ?? true),
    logout: vi.fn(),
  };

  TestBed.configureTestingModule({
    imports: [HeaderComponent],
    providers: [provideRouter([]), { provide: AuthService, useValue: fakeAuth }],
  });

  const fixture = TestBed.createComponent(HeaderComponent);
  fixture.detectChanges();
  return { fixture, fakeAuth };
}

describe('HeaderComponent', () => {
  it('renders the brand link', () => {
    const { fixture } = setup();
    const brand = fixture.nativeElement.querySelector('a[routerLink="/dashboard"]');
    expect(brand?.textContent?.trim()).toBe('AI Manager');
  });

  it("shows the signed-in user's initials and role badge", () => {
    const { fixture } = setup();
    const initials = fixture.nativeElement.querySelector('.avatar span');
    const roleBadge = fixture.nativeElement.querySelector('.badge');
    expect(initials?.textContent?.trim()).toBe('ER');
    expect(roleBadge?.textContent?.trim()).toBe('Teacher');
  });

  it('renders a mobile drawer toggle targeting #app-drawer', () => {
    const { fixture } = setup();
    const toggle = fixture.nativeElement.querySelector('label[for="app-drawer"]');
    expect(toggle).toBeTruthy();
    expect(toggle.className).toContain('lg:hidden');
  });

  it('signs out and navigates to /login when "Sign out" is clicked', () => {
    const { fixture, fakeAuth } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const signOutBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    signOutBtn.click();

    expect(fakeAuth.logout).toHaveBeenCalledOnce();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('hides the "Sign out" button when signed out', () => {
    const { fixture } = setup({ isAuthenticated: false });
    const signOutBtn = fixture.nativeElement.querySelector('button');
    expect(signOutBtn).toBeNull();
  });
});
