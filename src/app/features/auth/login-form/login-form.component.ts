import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DbTextBoxComponent, DbLoaderComponent, DbButtonComponent, DbAlertModalComponent } from 'db-ui-kit';
import { TrackingValidatorService } from '@shared/services/tracking-validator.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { GENERIC_ERROR_MESSAGE } from '@shared/utils/shared-util';
import { IconFontLoaderService } from '@shared/services/icon-font-loader.service';

const CODIGO_MIN_LENGTH = 3;

/** Login unico con codigo + password/PIN numerico. Sirve igual para OPERARIO y ADMIN: el
 * backend decide, segun el rol ya guardado en la base, si el valor ingresado se valida como
 * PIN o como password. */
@Component({
  selector: 'app-login-form',
  imports: [
    DbButtonComponent,
    DbTextBoxComponent,
    DbAlertModalComponent,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DbLoaderComponent,
  ],
  templateUrl: './login-form.component.html',
  styles: ``,
})
export class LoginFormComponent implements OnInit {
  public isLoading = signal(false);
  public showErrorModal = signal(false);
  public errorMessage = signal('');
  public readonly minLength: number = CODIGO_MIN_LENGTH;
  public readonly maxLength: number = 40;
  public readonly genericErrorMessage: string = GENERIC_ERROR_MESSAGE;

  public loginForm!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly iconFontLoader: IconFontLoaderService,
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      codigo: this.fb.control<string>('', {
        validators: [
          Validators.required,
          TrackingValidatorService.minTrackingLength(this.minLength),
        ],
        nonNullable: true,
      }),
      password: this.fb.control<string>('', {
        validators: [Validators.required, Validators.pattern(/^[0-9]+$/)],
        nonNullable: true,
      }),
    });
  }

  get codigoControl() {
    return this.loginForm.get('codigo')!;
  }

  get passwordControl() {
    return this.loginForm.get('password')!;
  }

  get codigoError(): string {
    if (this.codigoControl.invalid && this.codigoControl.touched) {
      return 'Ingresa un código válido';
    }
    return '';
  }

  get passwordError(): string {
    if (this.passwordControl.invalid && this.passwordControl.touched) {
      return 'Ingresa una contraseña válida (solo números)';
    }
    return '';
  }

  public handleCodigo(value: string): void {
    this.codigoControl.setValue(value);
    this.codigoControl.markAsTouched();
  }

  public handlePassword(value: string): void {
    this.passwordControl.setValue(value);
    this.passwordControl.markAsTouched();
  }

  get disabledSubmit(): boolean {
    return this.isLoading() || this.loginForm.invalid;
  }

  private async navigateAfterLogin(): Promise<void> {
    await this.iconFontLoader.waitForIconFont();
    this.isLoading.set(false);
    this.router.navigate(['/'], { replaceUrl: true });
  }

  public closeErrorModal(): void {
    this.showErrorModal.set(false);
  }

  public onEnter(event: Event): void {
    event.preventDefault();
    if (!this.disabledSubmit) {
      this.submit();
    }
  }

  public submit(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { codigo, password } = this.loginForm.getRawValue();

    this.authService.login(codigo, password).subscribe({
      next: () => {
        void this.navigateAfterLogin();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || this.genericErrorMessage);
        this.showErrorModal.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
