import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GridShapeComponent } from '../../../shared/components/grid-shape/grid-shape.component';
import { ThemeToggleTwoComponent } from '../../../common/theme-toggle-two/theme-toggle-two.component';

@Component({
  selector: 'app-auth-page-layout',
  imports: [
    GridShapeComponent,
    RouterModule,
    ThemeToggleTwoComponent,
  ],
  standalone: true,
  templateUrl: './auth-page-layout.component.html',
  styles: ``
})
export class AuthPageLayoutComponent {

}
