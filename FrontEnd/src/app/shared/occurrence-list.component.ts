import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CalendarOccurrence } from '../core/models/api.models';

/**
 * Renders a list of calendar occurrences. Extracted because the student dashboard,
 * teacher dashboard and calendar page all show the same thing.
 */
@Component({
  selector: 'app-occurrence-list',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (occurrences().length === 0) {
      <p class="italic text-base-content/60">{{ emptyMessage() }}</p>
    } @else {
      <ul class="divide-y divide-base-200">
        @for (occurrence of occurrences(); track $index) {
          <li class="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
            <div>
              <span class="block text-sm font-semibold">
                {{ occurrence.startsAtUtc | date: 'EEE d MMM' : 'UTC' }}
              </span>
              <span class="block text-xs text-base-content/70">
                {{ occurrence.startsAtUtc | date: 'HH:mm' : 'UTC' }} –
                {{ occurrence.endsAtUtc | date: 'HH:mm' : 'UTC' }}
              </span>
            </div>
            <div>
              <div class="font-medium">{{ occurrence.title }}</div>
              @if (occurrence.location) {
                <div class="text-sm text-base-content/70">{{ occurrence.location }}</div>
              }
            </div>
            <span
              class="badge badge-sm justify-self-start sm:justify-self-end"
              [class]="badgeClass(occurrence)"
            >
              {{ occurrence.eventType }}
            </span>
          </li>
        }
      </ul>
    }
  `,
})
export class OccurrenceListComponent {
  readonly occurrences = input.required<CalendarOccurrence[]>();
  readonly emptyMessage = input('Nothing scheduled.');

  protected badgeClass(occurrence: CalendarOccurrence): string {
    switch (occurrence.eventType) {
      case 'Class':
        return 'badge-primary';
      case 'Reminder':
      case 'AssignmentDue':
        return 'badge-accent';
      default:
        return 'badge-secondary';
    }
  }
}
