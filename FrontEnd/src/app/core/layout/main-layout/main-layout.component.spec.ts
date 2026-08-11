import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideHttpClient(),
        provideRouter([{ path: '', component: MainLayoutComponent }]),
      ],
    }).compileComponents();
  });

  it('renders the header, sidebar and router outlet inside the layout wrapper', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-theme="corporate"]')).toBeTruthy();
    expect(el.querySelector('header.navbar')?.textContent).toContain('AI Manager');
    expect(el.querySelector('aside .menu')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
