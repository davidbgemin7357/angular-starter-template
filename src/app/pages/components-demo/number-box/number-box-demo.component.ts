import { Component, signal } from '@angular/core';
import { DbComponentCardComponent, DbNumberBoxComponent } from 'db-ui-kit-angular';

/** Vitrina de db-numberbox: basico, limites min/max, step con flechas, decimales, estados,
 * deshabilitado, boton de limpiar e icono. */
@Component({
  selector: 'app-number-box-demo',
  imports: [DbNumberBoxComponent, DbComponentCardComponent],
  templateUrl: './number-box-demo.component.html',
})
export class NumberBoxDemoComponent {
  public lastEvent = signal('ninguno');

  public handleValue(field: string, value: string | number): void {
    this.lastEvent.set(`valueChange en "${field}" → ${JSON.stringify(value)} (${typeof value})`);
  }
}
