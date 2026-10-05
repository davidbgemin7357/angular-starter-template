import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DbComponentCardComponent, DbMultiSelectComponent, MultiSelectOption } from 'db-ui-kit';

/** Vitrina de db-multi-select: selección múltiple con búsqueda, botón limpiar, opciones con
 * imagen, obligatorio y deshabilitado. */
@Component({
  selector: 'app-multi-select-demo',
  imports: [DbComponentCardComponent, DbMultiSelectComponent, FormsModule],
  templateUrl: './multi-select-demo.component.html',
  styles: ``,
})
export class MultiSelectDemoComponent {
  public lastEvent = signal('Ninguno');
  public selectedCodes = signal<(number | string)[]>([]);
  public readonly disabledSelection: (number | string)[] = [1, 3];

  public readonly fruitOptions: MultiSelectOption[] = [
    { code: 1, text: 'Manzana' },
    { code: 2, text: 'Pera' },
    { code: 3, text: 'Plátano' },
    { code: 4, text: 'Mango' },
    { code: 5, text: 'Fresa' },
    { code: 6, text: 'Uva' },
  ];

  public readonly imageOptions: MultiSelectOption[] = [
    { code: 'a', text: 'Paisaje 1 (40x40)', url: 'https://picsum.photos/id/10/80', height: 40, width: 40 },
    { code: 'b', text: 'Paisaje 2 (40x40)', url: 'https://picsum.photos/id/20/80', height: 40, width: 40 },
    { code: 'c', text: 'Paisaje 3 (tamaño por defecto 100x100)', url: 'https://picsum.photos/id/30/200' },
    { code: 'd', text: 'Opción sin imagen' },
  ];

  public onSelectionChange(source: string, codes: (number | string)[]): void {
    this.lastEvent.set(`${source} → selectionChange: [${codes.join(', ')}]`);
  }

  public onValueChange(source: string, options: MultiSelectOption[]): void {
    this.lastEvent.set(`${source} → valueChange: ${options.map((o) => o.text).join(', ') || '(vacío)'}`);
  }

  public onBasicSelection(codes: (number | string)[]): void {
    this.selectedCodes.set(codes);
    this.onSelectionChange('Básico', codes);
  }
}
