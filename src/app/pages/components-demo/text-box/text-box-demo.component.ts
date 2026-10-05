import { Component, signal } from '@angular/core';
import { DbComponentCardComponent, DbTextBoxComponent } from 'db-ui-kit';

/** Vitrina de db-text-box: tipos text/password/email, estados, requerido, deshabilitado,
 * filtro por regexp, boton de limpiar, icono y limites de longitud. */
@Component({
  selector: 'app-text-box-demo',
  imports: [DbTextBoxComponent, DbComponentCardComponent],
  templateUrl: './text-box-demo.component.html',
})
export class TextBoxDemoComponent {
  public readonly onlyNumbers: RegExp = /[0-9]/;
  public readonly onlyLetters: string = '[a-zA-ZáéíóúÁÉÍÓÚñÑ ]';
  public readonly minLength: number = 3;
  public readonly maxLength: number = 10;

  public lastEvent = signal('ninguno');
  public requiredValue = signal('');

  public handleValue(field: string, value: string): void {
    this.lastEvent.set(`valueChange en "${field}" → "${value}"`);
  }

  public handleRequired(value: string): void {
    this.requiredValue.set(value);
    this.handleValue('Razón social', value);
  }

  get requiredError(): boolean {
    return this.requiredValue().trim() === '';
  }
}
