import { Component, signal } from '@angular/core';
import { DbComponentCardComponent, DbSelectBoxComponent, SelectBoxOption } from 'db-ui-kit-angular';

/** Vitrina de db-select-box: variantes de label, opciones con color/icono, búsqueda, botón
 * limpiar, estados de validación, deshabilitado y valor por defecto. */
@Component({
  selector: 'app-select-box-demo',
  imports: [DbComponentCardComponent, DbSelectBoxComponent],
  templateUrl: './select-box-demo.component.html',
  styles: ``,
})
export class SelectBoxDemoComponent {
  public lastEvent = signal('Ninguno');
  public basicValue = signal('');
  public colorValue = signal('');

  public readonly countryOptions: SelectBoxOption[] = [
    { code: 'PE', name: 'Perú' },
    { code: 'CO', name: 'Colombia' },
    { code: 'MX', name: 'México' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CL', name: 'Chile' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'UY', name: 'Uruguay' },
  ];

  /** El color solo se aplica si la opción tiene `active: true`; `active: false` la muestra
   * tachada y no seleccionable. */
  public readonly statusOptions: SelectBoxOption[] = [
    { code: 'ok', name: 'Aprobado', active: true, color: 'success', icon: 'check_circle', description: 'Solicitud aprobada' },
    { code: 'pending', name: 'Pendiente', active: true, color: 'warning', icon: 'schedule', description: 'En revisión' },
    { code: 'ko', name: 'Rechazado', active: true, color: 'danger', icon: 'cancel', description: 'Solicitud rechazada' },
    { code: 'archived', name: 'Archivado (inactivo)', active: false, icon: 'inventory_2', description: 'No seleccionable' },
  ];

  public onValueChange(source: string, value: string): void {
    this.lastEvent.set(`${source} → valueChange: "${value}"`);
  }

  public onOptionSelected(source: string, code: string | number): void {
    this.lastEvent.set(`${source} → optionSelected: "${code}"`);
  }

  public onBasicChange(value: string): void {
    this.basicValue.set(value);
    this.onValueChange('Básico', value);
  }

  public onColorChange(value: string): void {
    this.colorValue.set(value);
    this.onValueChange('Con color', value);
  }
}
