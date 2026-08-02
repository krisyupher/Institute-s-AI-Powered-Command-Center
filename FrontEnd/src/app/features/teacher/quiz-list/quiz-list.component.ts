import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-quiz-list',
  imports: [PlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      heading="My quizzes"
      message="Teacher Quiz List Coming Soon"
      route="/teacher/quizzes"
    />
  `,
})
export class QuizListComponent {}
