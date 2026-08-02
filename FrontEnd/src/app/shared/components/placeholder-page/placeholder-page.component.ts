import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Presentational stub used by the Ticket 1.5 page placeholders.
 *
 * Each route gets its own feature component (so routing, titles and lazy chunks are
 * already real); they share this body until the actual page is built. Replace the
 * feature component's template when the page lands — this component then has one
 * fewer caller and eventually goes away.
 */
@Component({
  selector: 'app-placeholder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h1>{{ heading() }}</h1>
      <p class="muted">{{ message() }}</p>
      @if (route(); as path) {
        <p class="muted small">
          Route: <code>{{ path }}</code>
        </p>
      }
    </section>
  `,
  styles: `
    .card {
      max-width: 640px;
    }

    code {
      background: var(--surface-alt);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
  `,
})
export class PlaceholderPageComponent {
  readonly heading = input.required<string>();
  readonly message = input('Coming soon.');
  readonly route = input('');
}
