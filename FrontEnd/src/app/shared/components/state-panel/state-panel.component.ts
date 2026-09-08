import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatePanelVariant = 'loading' | 'error' | 'empty';

@Component({
  selector: 'app-state-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-base-200 bg-base-100 px-6 py-12 text-center shadow-sm"
      [class.alert-error]="variant() === 'error'"
      [attr.role]="variant() === 'error' ? 'alert' : 'status'"
      [attr.aria-live]="variant() === 'error' ? 'assertive' : 'polite'"
    >
      @switch (variant()) {
        @case ('loading') {
          <span
            class="loading loading-spinner loading-lg text-primary"
            aria-label="Loading"
          ></span>
        }
        @case ('error') {
          <div class="grid h-12 w-12 place-items-center rounded-full bg-error/10 text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M12 9v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>
        }
        @default {
          <div class="grid h-12 w-12 place-items-center rounded-full bg-base-200 text-base-content/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v13.5a2.5 2.5 0 0 0-2.5-2.5H6a2 2 0 0 0-2 2V6.5Z"
              />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 8h8m-8 4h5" />
            </svg>
          </div>
        }
      }

      <div>
        <h2 class="text-lg font-semibold">{{ title() }}</h2>
        <p class="mt-1 max-w-xl text-sm text-base-content/70">{{ message() }}</p>
      </div>

      <div class="mt-2 flex flex-wrap justify-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class StatePanelComponent {
  readonly variant = input<StatePanelVariant>('empty');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
