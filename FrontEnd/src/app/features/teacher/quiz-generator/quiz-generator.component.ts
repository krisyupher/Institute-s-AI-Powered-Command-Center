import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-quiz-generator',
  imports: [PlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page
      heading="Quiz generator"
      message="Teacher Quiz Generator Coming Soon"
      route="/teacher/generator"
    />
  `,
})
export class QuizGeneratorComponent {}
