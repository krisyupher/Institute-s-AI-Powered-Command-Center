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
      <p class="empty">{{ emptyMessage() }}</p>
    } @else {
      <ul class="list">
        @for (occurrence of occurrences(); track $index) {
          <li>
            <div class="when">
              <span class="day">{{ occurrence.startsAtUtc | date: 'EEE d MMM' : 'UTC' }}</span>
              <span class="time">
                {{ occurrence.startsAtUtc | date: 'HH:mm' : 'UTC' }} –
                {{ occurrence.endsAtUtc | date: 'HH:mm' : 'UTC' }}
              </span>
            </div>
            <div class="what">
              <div class="title">{{ occurrence.title }}</div>
              @if (occurrence.location) {
                <div class="muted small">{{ occurrence.location }}</div>
              }
            </div>
            <span class="badge" [class]="badgeClass(occurrence)">
              {{ occurrence.eventType }}
            </span>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      display: grid;
      grid-template-columns: 120px 1fr auto;
      gap: 0.75rem;
      align-items: center;
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border);
    }

    li:last-child {
      border-bottom: none;
    }

    .day {
      display: block;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .time {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .title {
      font-weight: 500;
    }

    @media (max-width: 640px) {
      li {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class OccurrenceListComponent {
  readonly occurrences = input.required<CalendarOccurrence[]>();
  readonly emptyMessage = input('Nothing scheduled.');

  protected badgeClass(occurrence: CalendarOccurrence): string {
    switch (occurrence.eventType) {
      case 'Class':
        return 'badge-class';
      case 'Reminder':
      case 'AssignmentDue':
        return 'badge-reminder';
      default:
        return '';
    }
  }
}
