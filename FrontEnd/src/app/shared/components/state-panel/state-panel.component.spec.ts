import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { StatePanelComponent } from './state-panel.component';

describe('StatePanelComponent', () => {
  it('renders loading feedback with a polite status role', () => {
    TestBed.configureTestingModule({ imports: [StatePanelComponent] });
    const fixture = TestBed.createComponent(StatePanelComponent);
    fixture.componentRef.setInput('variant', 'loading');
    fixture.componentRef.setInput('title', 'Loading quizzes');
    fixture.componentRef.setInput('message', 'Please wait while your quizzes load.');
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('[role]');
    expect(panel?.getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.querySelector('.loading-spinner')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Loading quizzes');
  });

  it('renders error feedback with an assertive alert role', () => {
    TestBed.configureTestingModule({ imports: [StatePanelComponent] });
    const fixture = TestBed.createComponent(StatePanelComponent);
    fixture.componentRef.setInput('variant', 'error');
    fixture.componentRef.setInput('title', 'Something went wrong');
    fixture.componentRef.setInput('message', 'Try again shortly.');
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('[role]');
    expect(panel?.getAttribute('role')).toBe('alert');
    expect(panel?.getAttribute('aria-live')).toBe('assertive');
    expect(fixture.nativeElement.textContent).toContain('Try again shortly.');
  });
});
