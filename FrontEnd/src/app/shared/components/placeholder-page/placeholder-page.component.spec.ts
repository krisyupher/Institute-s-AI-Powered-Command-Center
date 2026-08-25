import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import { PlaceholderPageComponent } from './placeholder-page.component';

describe('PlaceholderPageComponent', () => {
  it('renders the required heading and defaults the message and route', () => {
    TestBed.configureTestingModule({ imports: [PlaceholderPageComponent] });
    const fixture = TestBed.createComponent(PlaceholderPageComponent);
    fixture.componentRef.setInput('heading', 'Admin dashboard');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin dashboard');
    expect(fixture.nativeElement.textContent).toContain('Coming soon.');
    expect(fixture.nativeElement.querySelector('code')).toBeNull();
  });

  it('renders the given message and route badge when provided', () => {
    TestBed.configureTestingModule({ imports: [PlaceholderPageComponent] });
    const fixture = TestBed.createComponent(PlaceholderPageComponent);
    fixture.componentRef.setInput('heading', 'Admin dashboard');
    fixture.componentRef.setInput('message', 'Admin Dashboard Coming Soon');
    fixture.componentRef.setInput('route', '/admin/dashboard');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Admin Dashboard Coming Soon');
    expect(fixture.nativeElement.querySelector('code')?.textContent).toBe('/admin/dashboard');
  });
});
