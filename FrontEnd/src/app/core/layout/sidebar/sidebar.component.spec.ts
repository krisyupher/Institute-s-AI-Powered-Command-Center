import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

function setup(role: UserRole) {
  const fakeAuth = { role: signal(role) };

  TestBed.configureTestingModule({
    imports: [SidebarComponent],
    providers: [provideRouter([]), { provide: AuthService, useValue: fakeAuth }],
  });

  const fixture = TestBed.createComponent(SidebarComponent);
  fixture.detectChanges();
  return fixture;
}

function linkLabels(fixture: ReturnType<typeof setup>): string[] {
  return Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a')).map((a) =>
    a.textContent.trim(),
  );
}

describe('SidebarComponent', () => {
  it('shows the teacher nav items for a Teacher session', () => {
    const fixture = setup('Teacher');
    expect(linkLabels(fixture)).toEqual(['Create AI Quiz', 'My Quizzes']);
  });

  it('shows the student nav items for a Student session', () => {
    const fixture = setup('Student');
    expect(linkLabels(fixture)).toEqual(['Available Quizzes', 'My Results']);
  });

  it('shows the admin nav items for an Admin session', () => {
    const fixture = setup('Admin');
    expect(linkLabels(fixture)).toEqual(['Dashboard']);
  });

  describe('mobile drawer auto-close', () => {
    afterEach(() => {
      document.getElementById('app-drawer')?.remove();
    });

    it('unchecks the #app-drawer toggle when a nav link is clicked', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'app-drawer';
      checkbox.checked = true;
      document.body.appendChild(checkbox);

      const fixture = setup('Teacher');
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      const firstLink: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
      firstLink.click();

      expect(checkbox.checked).toBe(false);
    });

    it('is a no-op when no drawer toggle is present (desktop)', () => {
      const fixture = setup('Teacher');
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      const firstLink: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
      expect(() => firstLink.click()).not.toThrow();
    });
  });
});
