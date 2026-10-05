import { Component } from '@angular/core';
import { LoginFormComponent } from '../login-form/login-form.component';
import { AuthPageLayoutComponent } from '../auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-login',
  imports: [
    AuthPageLayoutComponent,
    LoginFormComponent,
  ],
  templateUrl: './login.component.html',
  styles: ``
})
export class LoginComponent {

}
