import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import {
  DataTableAction,
  DataTableColumn,
  DbBadgeComponent,
  DbButtonComponent,
  DbCheckboxComponent,
  DbComponentCardComponent,
  DbDataTableComponent,
  DbDatePickerComponent,
  DbHtmlEditorComponent,
  DbModalComponent,
  DbMultiSelectComponent,
  DbSelectBoxComponent,
  DbSwitchComponent,
  DbTextBoxComponent,
  DbToastService,
  DbTooltipComponent,
  MultiSelectOption,
  SelectBoxOption,
} from 'db-ui-kit';
import { ThemeService } from '@shared/services/theme.service';

/** Vitrina del tema Liquid Glass. Junta en una sola pantalla los casos delicados del efecto:
 * dropdowns `fixed` dentro de cards de vidrio, dos multi-select apilados, date-picker,
 * menús de la tabla, tooltips, toasts, modal y los popovers del html-editor. */
@Component({
  selector: 'app-glass-demo',
  imports: [
    AsyncPipe,
    FormsModule,
    DbBadgeComponent,
    DbButtonComponent,
    DbCheckboxComponent,
    DbComponentCardComponent,
    DbDataTableComponent,
    DbDatePickerComponent,
    DbHtmlEditorComponent,
    DbModalComponent,
    DbMultiSelectComponent,
    DbSelectBoxComponent,
    DbSwitchComponent,
    DbTextBoxComponent,
    DbTooltipComponent,
  ],
  templateUrl: './glass-demo.component.html',
})
export class GlassDemoComponent {
  private readonly toastService = inject(DbToastService);
  public readonly themeService = inject(ThemeService);

  public modalOpen = signal(false);

  public readonly cityOptions: SelectBoxOption[] = [
    { code: 'LIM', name: 'Lima' },
    { code: 'CUS', name: 'Cusco' },
    { code: 'AQP', name: 'Arequipa' },
    { code: 'TRU', name: 'Trujillo' },
    { code: 'PIU', name: 'Piura' },
  ];

  public readonly tagOptions: MultiSelectOption[] = [
    { code: 1, text: 'Urgente' },
    { code: 2, text: 'Cliente VIP' },
    { code: 3, text: 'Seguimiento' },
    { code: 4, text: 'Facturación' },
    { code: 5, text: 'Soporte' },
  ];

  public readonly columns: DataTableColumn[] = [
    { columnaName: 'N°', dataProperty: 'id', visible: true, sortable: true, alignment: 'center', datatype: 'number', widthFr: 0.5 },
    { columnaName: 'Cliente', dataProperty: 'cliente', visible: true, sortable: true, alignment: 'left', datatype: 'string', widthFr: 1.5 },
    { columnaName: 'Monto', dataProperty: 'monto', visible: true, sortable: true, alignment: 'right', datatype: 'number' },
  ];

  public readonly actions: DataTableAction[] = [
    { action: 'VER', actionDescription: 'Ver detalle', icon: 'visibility' },
    { action: 'EDITAR', actionDescription: 'Editar', icon: 'edit' },
  ];

  public readonly rows = [
    { id: 1, cliente: 'Comercial Andina SAC', monto: 1250.5 },
    { id: 2, cliente: 'Distribuidora del Sur', monto: 980 },
    { id: 3, cliente: 'Inversiones Pacífico', monto: 4300.75 },
    { id: 4, cliente: 'Tecnología Norte EIRL', monto: 615.2 },
    { id: 5, cliente: 'Servicios Integrales Lima', monto: 2210 },
    { id: 6, cliente: 'Agroexport Ica', monto: 3875.4 },
  ];

  public readonly editorHtml =
    '<h3>Vidrio líquido</h3><p>La barra y sus <strong>popovers</strong> también usan el tema.</p>';

  public showToast(variant: 'success' | 'error' | 'warning' | 'primary' | 'info'): void {
    this.toastService.open(variant, `Toast "${variant}" sobre vidrio`);
  }
}
