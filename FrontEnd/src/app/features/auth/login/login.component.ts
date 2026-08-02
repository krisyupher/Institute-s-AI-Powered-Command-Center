import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PlaceholderPageComponent } from '../../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-login',
  imports: [PlaceholderPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-placeholder-page heading="Sign in" message="Login Coming Soon" route="/login" />
  `,
})
export class LoginComponent {}
