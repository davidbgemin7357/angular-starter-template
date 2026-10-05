import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DbComponentCardComponent, DbTextAreaComponent } from 'db-ui-kit-angular';

/** Vitrina de db-text-area: basico, filas, limite de caracteres, error con hint, requerido,
 * deshabilitado y boton de limpiar. db-text-area no expone [value] como input: el valor
 * inicial se carga via ngModel (ControlValueAccessor). */
@Component({
  selector: 'app-text-area-demo',
  imports: [DbTextAreaComponent, DbComponentCardComponent, FormsModule],
  templateUrl: './text-area-demo.component.html',
})
export class TextAreaDemoComponent {
  public readonly maxLength: number = 120;
  public readonly digitsRegexp: RegExp = /[0-9]/;

  public lastEvent = signal('ninguno');
  public limitedValue = signal('');
  public requiredValue = signal('');
  public clearableValue: string = 'Este texto se puede borrar con la X de la esquina.';

  public handleValue(field: string, value: string): void {
    this.lastEvent.set(`valueChange en "${field}" → "${value}"`);
  }

  public handleLimited(value: string): void {
    this.limitedValue.set(value);
    this.handleValue('Con límite', value);
  }

  public handleRequired(value: string): void {
    this.requiredValue.set(value);
    this.handleValue('Requerido', value);
  }

  get requiredError(): boolean {
    return this.requiredValue().trim() === '';
  }
}
