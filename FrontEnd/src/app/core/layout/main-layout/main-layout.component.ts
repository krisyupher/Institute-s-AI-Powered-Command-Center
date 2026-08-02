import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

/**
 * Application shell (Ticket 1.4): sticky header on top, fixed-width sidebar on the
 * left, and a content column hosting the `<router-outlet>` where feature routes render.
 * The `data-theme="corporate"` on the wrapper pins the DaisyUI theme explicitly.
 */
@Component({
  selector: 'app-main-layout',
  imports: [HeaderComponent, SidebarComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {}
