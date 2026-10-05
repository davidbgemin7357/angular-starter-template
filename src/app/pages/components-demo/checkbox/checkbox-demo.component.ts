import { Component, signal } from '@angular/core';
import { CheckboxPicture, DbCheckboxComponent, DbComponentCardComponent } from 'db-ui-kit-angular';

/** Vitrina de db-checkbox: label/text, marcado inicial, imagen, contenido HTML y
 * deshabilitado. */
@Component({
  selector: 'app-checkbox-demo',
  imports: [DbComponentCardComponent, DbCheckboxComponent],
  templateUrl: './checkbox-demo.component.html',
  styles: ``,
})
export class CheckboxDemoComponent {
  public lastEvent = signal('Ninguno');
  public termsAccepted = signal(false);

  public readonly defaultPicture: CheckboxPicture = { url: 'https://picsum.photos/id/40/200' };
  public readonly smallPicture: CheckboxPicture = { url: 'https://picsum.photos/id/50/120', height: 60, width: 60 };
  public readonly htmlContent: string =
    'Acepto recibir <strong>promociones</strong> por <em>correo electrónico</em>';

  public onValueChange(source: string, value: boolean): void {
    this.lastEvent.set(`${source} → valueChange: ${value}`);
  }

  public onTermsChange(value: boolean): void {
    this.termsAccepted.set(value);
    this.onValueChange('Términos', value);
  }
}
