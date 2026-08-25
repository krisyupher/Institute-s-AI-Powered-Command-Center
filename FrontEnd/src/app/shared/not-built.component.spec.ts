import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import { NotBuiltComponent } from './not-built.component';

describe('NotBuiltComponent', () => {
  it('explains the page is not built yet and links back to the dashboard', () => {
    TestBed.configureTestingModule({
      imports: [NotBuiltComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(NotBuiltComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Not built yet');
    const backLink = fixture.nativeElement.querySelector('a[routerLink="/dashboard"]');
    expect(backLink?.textContent).toContain('Back to dashboard');
  });
});
