import { Component, signal } from '@angular/core';
import {
  ButtonClickEvent,
  ButtonDropdownItem,
  DbButtonComponent,
  DbComponentCardComponent,
  Size,
  Type,
  Variant,
} from 'db-ui-kit-angular';

/** Vitrina de db-button: variantes de color, tipo full/outline, tamanos, deshabilitado,
 * iconos (nombres de Material Symbols) y desplegable de opciones. */
@Component({
  selector: 'app-button-demo',
  imports: [DbButtonComponent, DbComponentCardComponent],
  templateUrl: './button-demo.component.html',
})
export class ButtonDemoComponent {
  public readonly variants: Variant[] = ['primary', 'error', 'warning', 'success'];
  public readonly types: Type[] = ['full', 'outline'];
  public readonly sizes: Size[] = ['sm', 'md'];

  public readonly dropdownItems: ButtonDropdownItem[] = [
    { icon: 'edit', text: 'Editar', code: 'EDIT' },
    { icon: 'content_copy', text: 'Duplicar', code: 'COPY' },
    { icon: 'delete', text: 'Eliminar', code: 'DELETE' },
  ];

  public lastEvent = signal('ninguno');
  public clickCount = signal(0);

  public handleClick(label: string, event: ButtonClickEvent): void {
    this.clickCount.update((count) => count + 1);
    this.lastEvent.set(`btnClick en "${label}" (disabled: ${event.disabled}) — total: ${this.clickCount()}`);
  }

  public handleDropdownItem(code: string): void {
    this.lastEvent.set(`dropdownItemClick → ${code}`);
  }
}
