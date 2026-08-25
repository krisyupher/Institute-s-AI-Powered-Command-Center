import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';

import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

/**
 * Regression coverage for the responsive-drawer fix: previously the sidebar was a bare
 * `w-64` element with no way to collapse on mobile, crushing every page's content into a
 * narrow column and overflowing the viewport horizontally. These assertions pin the
 * DaisyUI drawer structure (`#app-drawer` toggle + `.drawer-content` + `.drawer-side`) so
 * that structure can't silently regress back to the old fixed-sidebar layout.
 */
const TEACHER: User = {
  id: 1,
  fullName: 'Elena Rivera',
  email: 'teacher@humber.ca',
  role: 'Teacher',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};

describe('MainLayoutComponent', () => {
  function setup() {
    const fakeAuth = {
      user: signal(TEACHER),
      role: signal(TEACHER.role),
      isAuthenticated: signal(true),
      logout: () => {},
    };

    TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: fakeAuth }],
    });

    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a checkbox-driven drawer toggle', () => {
    const fixture = setup();
    const toggle: HTMLInputElement = fixture.nativeElement.querySelector('#app-drawer');
    expect(toggle).toBeTruthy();
    expect(toggle.type).toBe('checkbox');
    expect(toggle.className).toContain('drawer-toggle');
  });

  it('keeps the sidebar permanently open at the lg breakpoint via lg:drawer-open', () => {
    const fixture = setup();
    const drawer = fixture.nativeElement.querySelector('.drawer');
    expect(drawer.className).toContain('lg:drawer-open');
  });

  it('bounds page content to its own scrollable region instead of the whole document', () => {
    const fixture = setup();
    const content = fixture.nativeElement.querySelector('.drawer-content');
    expect(content.className).toContain('overflow-y-auto');
  });

  it('renders the sidebar inside .drawer-side', () => {
    const fixture = setup();
    const side = fixture.nativeElement.querySelector('.drawer-side app-sidebar');
    expect(side).toBeTruthy();
  });

  it('renders the header outside the scrollable drawer content, so it stays pinned', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('app-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.drawer app-header')).toBeNull();
  });
});
