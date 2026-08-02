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
    <section class="card max-w-2xl bg-base-100 shadow-md border border-base-200 rounded-2xl">
      <div class="card-body">
        <h1 class="card-title text-2xl">{{ heading() }}</h1>
        <p class="text-base-content/70">{{ message() }}</p>
        @if (route(); as path) {
          <p class="text-sm text-base-content/70">
            Route:
            <code class="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs">{{ path }}</code>
          </p>
        }
      </div>
    </section>
  `,
})
export class PlaceholderPageComponent {
  readonly heading = input.required<string>();
  readonly message = input('Coming soon.');
  readonly route = input('');
}
