import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';

import { DashboardRedirectComponent } from './dashboard-redirect.component';
import { AuthService } from '../../core/services/auth.service';

describe('DashboardRedirectComponent', () => {
  it("navigates to the signed-in user's home route as soon as it's created", () => {
    TestBed.configureTestingModule({
      imports: [DashboardRedirectComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { homeRoute: signal('/admin/dashboard') } },
      ],
    });

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    TestBed.createComponent(DashboardRedirectComponent);

    expect(navigateSpy).toHaveBeenCalledWith('/admin/dashboard');
  });
});
