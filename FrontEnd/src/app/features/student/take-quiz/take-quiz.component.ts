import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-take-quiz',
  imports: [PlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      heading="Take quiz"
      message="Take Quiz Coming Soon"
      [route]="'/student/quizzes/' + quizId()"
    />
  `,
})
export class TakeQuizComponent {
  /** Bound from the route parameter by `withComponentInputBinding()`. */
  readonly quizId = input('');
}
