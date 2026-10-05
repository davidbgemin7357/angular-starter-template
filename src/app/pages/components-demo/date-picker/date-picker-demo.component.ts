import { Component, signal } from '@angular/core';
import { DbComponentCardComponent, DbDatePickerComponent, DbDatePickerRangeValue } from 'db-ui-kit';

interface DatePickerChange {
  selectedDates: Date[];
  dateStr: string;
}

/** Vitrina de db-date-picker (flatpickr): modos single/multiple/range/time/datetime, formatos
 * ymd/dmy, valor inicial, obligatorio, error, deshabilitado y botón limpiar. */
@Component({
  selector: 'app-date-picker-demo',
  imports: [DbComponentCardComponent, DbDatePickerComponent],
  templateUrl: './date-picker-demo.component.html',
  styles: ``,
})
export class DatePickerDemoComponent {
  public lastEvent = signal('Ninguno');

  /** Los valores iniciales de fecha deben respetar `format`: 'YYYY-MM-DD' (ymd) o
   * 'DD-MM-YYYY' (dmy). */
  public readonly multipleValue: string[] = ['2025-01-01', '2025-01-15', '2025-02-28'];
  public readonly rangeValue: DbDatePickerRangeValue = { startDate: '2025-03-01', endDate: '2025-03-10' };
  /** En modo datetime el valor inicial se parsea como 'dd/mm/YYYY HH:mm[:ss]'. */
  public readonly datetimeValue: string = '25/12/2025 14:30';

  public onValueChange(source: string, event: DatePickerChange): void {
    this.lastEvent.set(
      `${source} → dateStr: "${event.dateStr}" (${event.selectedDates.length} fecha(s))`,
    );
  }
}
