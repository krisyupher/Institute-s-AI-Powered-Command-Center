import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-available-quizzes',
  imports: [PlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      heading="Available quizzes"
      message="Student Quiz List Coming Soon"
      route="/student/quizzes"
    />
  `,
})
export class AvailableQuizzesComponent {}
