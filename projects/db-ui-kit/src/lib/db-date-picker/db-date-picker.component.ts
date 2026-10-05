import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ViewChild,
  forwardRef,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { DbDatePickerDateFormat, DbDatePickerMode, DbDatePickerValue } from './db-date-picker.types';
import {
  DbDatePickerRangeValue,
  DbDatePickerInternalValue,
  DbDatePickerOnChangeFn,
  DbDatePickerOnTouchedFn,
} from './db-date-picker.interface';

const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
/** 'dd/mm/YYYY HH:mm[:ss]' (formato de entrada día-primero). */
const DATETIME_DMY_SLASH_REGEX =
  /^(\d{2})\/(\d{2})\/(\d{4}) ([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
/** 'YYYY-MM-DD HH:mm[:ss]' (el formato que el componente muestra y emite: 'Y-m-d H:i[:S]'). */
const DATETIME_YMD_DASH_REGEX =
  /^(\d{4})-(\d{2})-(\d{2}) ([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
/** 'DD/MM/YYYY' — las fechas con "/" siempre se interpretan día-primero (locale es),
 * independientemente del input `format`. */
const DATE_DMY_SLASH_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

interface DateTimeParts {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds?: string;
}

function matchDateTime(value: string): DateTimeParts | null {
  const dmy = value.match(DATETIME_DMY_SLASH_REGEX);
  if (dmy) {
    const [, day, month, year, hours, minutes, seconds] = dmy;
    return { year, month, day, hours, minutes, seconds };
  }

  const ymd = value.match(DATETIME_YMD_DASH_REGEX);
  if (ymd) {
    const [, year, month, day, hours, minutes, seconds] = ymd;
    return { year, month, day, hours, minutes, seconds };
  }

  return null;
}

@Component({
  selector: 'db-date-picker',
  imports: [CommonModule],
  templateUrl: './db-date-picker.component.html',
  styles: ``,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbDatePickerComponent),
      multi: true,
    },
  ],
})
export class DbDatePickerComponent implements ControlValueAccessor, OnChanges {
  @Input() id!: string;
  @Input() mode: DbDatePickerMode = 'single';
  /** Formato para single/range/multiple: 'ymd' (año-mes-día, default) o 'dmy' (día-mes-año). */
  @Input() format: DbDatePickerDateFormat = 'ymd';
  @Input() label?: string = "";
  @Input() placeholder?: string = "";
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() value?: DbDatePickerValue;
  @Input() showClearButton: boolean = false;
  @Input() error: boolean = false;
  @Output() valueChange = new EventEmitter<{ selectedDates: Date[]; dateStr: string }>();

  @ViewChild('dateInput', { static: false }) dateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('multipleDisplay', { static: false }) multipleDisplay?: ElementRef<HTMLDivElement>;

  /** true cuando el usuario tipeó algo que no respeta el formato configurado — no se
   * asigna ningún valor de fecha mientras esto sea true (ver handleManualBlur). */
  public formatError = false;
  /** Fechas seleccionadas en modo multiple, con el formato de flatpickr (ver refreshMultipleDates). */
  public multipleDates: string[] = [];
  private readonly cdr = inject(ChangeDetectorRef);
  /** Solo true cuando el usuario tipeó algo con el teclado (evento "input" real) — evita
   * que el blur disparado por un clic en un día del calendario (el navegador quita el foco
   * del input antes de procesar el clic) reprocese/reasigne la fecha que ya estaba puesta,
   * lo que cerraba el calendario antes de que el clic en el día llegara a seleccionar nada
   * (de ahí el "hay que hacer doble clic"). */
  private manualEditPending = false;

  private flatpickrInstance: flatpickr.Instance | undefined;
  /** true tras ngOnDestroy — evita que callbacks async de flatpickr (ej. onReady, que se
   * dispara en un setTimeout interno) operen sobre una instancia ya destruida cuando el
   * componente se destruye muy rápido (ej. fila quitada en un @for, o modal cerrado) antes
   * de que ese callback llegue a ejecutarse. */
  private destroyed = false;
  private internalValue: DbDatePickerInternalValue = '';
  private onChange: DbDatePickerOnChangeFn = () => {};
  private onTouched: DbDatePickerOnTouchedFn = () => {};

  private monthPanelEl?: HTMLDivElement;
  private monthPanelYear = new Date().getFullYear();
  private panelMode: 'months' | 'years' = 'months';
  private decadeStartYear = 0;
  private static monthPanelStylesInjected = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['value'] &&
      !changes['value'].isFirstChange() &&
      this.flatpickrInstance &&
      this.value !== undefined &&
      this.value !== null
    ) {
      if (this.mode === 'time' || this.mode === 'datetime') {
        const showSeconds = this.hasSecondsInValue(this.value);
        this.flatpickrInstance.set('enableSeconds', showSeconds);
        this.flatpickrInstance.set('dateFormat', this.getDateFormat(showSeconds));
      }

      this.applyInputValue(this.value);
    }
  }

  ngAfterViewInit() {
    const isTimeMode = this.mode === 'time';
    const isDateTimeMode = this.mode === 'datetime';
    const hasTimePicker = isTimeMode || isDateTimeMode;
    const showSeconds = hasTimePicker && this.hasSecondsInValue(this.value);
    const isMultipleMode = this.mode === 'multiple';

    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, {
      mode: (hasTimePicker ? 'single' : this.mode) as 'single' | 'multiple' | 'range' | 'time',
      // static:false (default) — el calendario se anexa a document.body en vez de quedar
      // dentro del wrapper del input. Con static:true, cuando este componente vive dentro de
      // un contenedor con overflow-y-auto (ej. el body de db-modal), el calendario
      // absolutamente posicionado infla el scrollHeight de ese contenedor y aparece un
      // scroll no deseado en vez de superponerse. Anexado a body, flatpickr calcula su
      // posición (fixed/absolute) en base al viewport, quedando fuera de cualquier overflow
      // local — mismo criterio que el dropdown de DbMultiSelectComponent (position: fixed).
      static: false,
      monthSelectorType: 'static',
      dateFormat: this.getDateFormat(showSeconds),
      locale: Spanish,
      clickOpens: !this.disabled,
      allowInput: !this.disabled,
      // Multiple: el input está oculto; el calendario se posiciona bajo el div visible y se
      // abre desde openMultiple(). No se tipea a mano.
      ...(isMultipleMode && this.multipleDisplay
        ? {
            positionElement: this.multipleDisplay.nativeElement,
            clickOpens: false,
            allowInput: false,
          }
        : {}),
      ...(hasTimePicker
        ? {
            enableTime: true,
            noCalendar: isTimeMode,
            time_24hr: false,
            minuteIncrement: 1,
            enableSeconds: showSeconds,
          }
        : {}),
      onReady: (_selectedDates, _dateStr, instance) => {
        // onReady se dispara en un setTimeout interno de flatpickr, así que puede llegar
        // después de que el componente (y por ende esta instancia) ya haya sido destruido.
        if (this.destroyed || !instance.calendarContainer) {
          return;
        }
        if (hasTimePicker) {
          this.setupScrollToChangeTime(instance);
        }
        if (!isTimeMode) {
          this.setupMonthPicker(instance);
        }
      },
      // Se dispara en cada cambio del valor (clic, setDate, clear), incluso sin onChange.
      onValueUpdate: () => {
        this.refreshMultipleDates();
      },
      onClose: () => {
        this.closeMonthPanel();
        // En multiple el input oculto nunca recibe blur, así que se marca touched al cerrar.
        if (isMultipleMode) {
          this.onTouched();
        }
      },
      onChange: (selectedDates, dateStr, instance) => {
        // Actualizar el valor interno según el modo
        if (this.mode === 'range' || this.mode === 'multiple') {
          // Para rango/múltiple se emiten strings de fecha LOCAL en el formato configurado
          // (Y-m-d o d-m-Y). No se usa toISOString(): en zonas UTC+ la medianoche local
          // pasa a ser el día anterior en UTC.
          const format = this.dateOnlyFlatpickrFormat();
          this.internalValue = selectedDates.map((date) => instance.formatDate(date, format));
        } else {
          // Para single o time, guardamos el string
          this.internalValue = dateStr;
        }

        this.onChange(this.internalValue);
        this.onTouched();

        // Emitir solo los datos serializables, no el instance
        this.valueChange.emit({
          selectedDates: selectedDates,
          dateStr: dateStr,
        });
      },
    });

    // Prioridad: la propiedad "value" explícita sobre el valor de Reactive Forms
    if (this.value !== undefined && this.value !== null) {
      this.applyInputValue(this.value);
    } else if (this.internalValue) {
      this.setDateFromValue(this.internalValue);
    }

    // El valor inicial se aplica después del primer chequeo de la vista.
    if (isMultipleMode) {
      this.refreshMultipleDates();
      this.cdr.detectChanges();
    }

    if (this.mode === 'single') {
      this.dateInput.nativeElement.addEventListener('keydown', (event) => this.handleManualKeydown(event));
      this.dateInput.nativeElement.addEventListener('blur', () => this.handleManualBlur());
    }

    // Sin esto, el FormControl asociado nunca queda "touched" si el usuario abre el
    // calendario y lo cierra sin elegir una fecha (onTouched solo se llamaba antes al
    // seleccionar una fecha o al limpiar), por lo que el mensaje de "campo obligatorio"
    // del padre (basado en control.invalid && control.touched) nunca llegaba a mostrarse.
    this.dateInput.nativeElement.addEventListener('blur', () => this.onTouched());
  }

  /** Solo deja escribir dígitos y el separador del formato elegido (ej. "-" en Y-m-d /
   * d-m-Y) — bloquea letras u otros símbolos antes de que lleguen al input.
   *
   * También es el único lugar donde se marca "manualEditPending = true": a propósito NO se
   * usa el evento "input" para esto, porque flatpickr dispara un evento input sintético
   * sobre el campo cuando seleccionas un día con el mouse (para que integraciones tipo
   * ngModel sigan funcionando) — si detectáramos edición manual con "input", un clic en un
   * día también activaría la bandera, y el blur posterior volvería a reprocesar/reasignar
   * la fecha justo cuando el día ya la había seleccionado, lo que rompía el clic (había que
   * hacerlo dos veces). "keydown" en cambio solo puede venir de tipeo real del teclado.
   */
  private handleManualKeydown(event: KeyboardEvent): void {
    const teclasNavegacion = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Escape', 'Home', 'End',
    ];

    if (event.ctrlKey || event.metaKey || event.altKey || teclasNavegacion.includes(event.key)) {
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.manualEditPending = true;
      this.formatError = false;
      return;
    }

    const separador = this.dateSeparator().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const permitido = new RegExp(`^[0-9${separador}]$`);

    if (!permitido.test(event.key)) {
      event.preventDefault();
      return;
    }

    this.manualEditPending = true;
    this.formatError = false;
  }

  private dateSeparator(): string {
    const match = this.dateOnlyFlatpickrFormat().match(/[^a-zA-Z]/);
    return match ? match[0] : '-';
  }

  /** Al salir del input: si lo tipeado no respeta el formato exacto (o no es una fecha
   * real, ej. 31-02-2026), NO se asigna ningún valor — solo se marca formatError para que
   * el template muestre el aviso en rojo. El texto invalido queda visible para corregirlo. */
  private handleManualBlur(): void {
    if (!this.manualEditPending) {
      return;
    }
    this.manualEditPending = false;

    const raw = this.dateInput.nativeElement.value.trim();

    if (!raw) {
      this.formatError = false;
      return;
    }

    const fecha = this.parseDateString(raw);

    if (!fecha) {
      this.formatError = true;
      return;
    }

    this.formatError = false;
    this.flatpickrInstance?.setDate(fecha, true);
  }

  get formatHint(): string {
    return this.format === 'dmy' ? 'DD-MM-AAAA' : 'AAAA-MM-DD';
  }

  /** Reemplaza las flechas de step del año (nativas del input number) por un selector de
   * meses tipo DevExpress DateBox: clic en el header (mes + año) muestra una grilla de los
   * 12 meses del año mostrado, con flechas para cambiar de año; clic en un mes navega el
   * calendario a ese mes/año y vuelve a la vista de días. */
  private setupMonthPicker(instance: flatpickr.Instance): void {
    DbDatePickerComponent.injectMonthPanelStyles();

    const header = instance.calendarContainer.querySelector<HTMLElement>('.flatpickr-current-month');
    if (!header) {
      return;
    }

    header.classList.add('db-dp-month-trigger');
    header.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.monthPanelEl) {
        this.closeMonthPanel();
      } else {
        this.openMonthPanel(instance);
      }
    });
  }

  private openMonthPanel(instance: flatpickr.Instance): void {
    const fechaActual = instance.selectedDates[0] ?? instance.now;
    this.monthPanelYear = fechaActual.getFullYear();
    this.panelMode = 'months';

    // Fija la altura ANTES de ocultar los días: sin esto, .flatpickr-calendar se encoge al
    // quedarse sin el contenido de la grilla de días, y el panel (inset:0, relativo a ese
    // contenedor ya encogido) queda más chico que la grilla de 12 meses — el sobrante se
    // renderiza fuera de la caja con fondo, viéndose "transparente".
    instance.calendarContainer.style.minHeight = `${instance.calendarContainer.offsetHeight}px`;

    const innerContainer = instance.calendarContainer.querySelector<HTMLElement>('.flatpickr-innerContainer');
    if (innerContainer) {
      innerContainer.style.display = 'none';
    }

    const panel = document.createElement('div');
    panel.className = 'db-dp-month-panel';

    const header = document.createElement('div');
    header.className = 'db-dp-month-panel-header';

    const yearLabel = document.createElement('span');
    yearLabel.className = 'db-dp-month-panel-year db-dp-month-panel-year-trigger';
    yearLabel.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.panelMode !== 'years') {
        this.panelMode = 'years';
        this.decadeStartYear = Math.floor(this.monthPanelYear / 10) * 10;
        this.renderYearGrid(instance, grid, yearLabel);
      }
    });

    const grid = document.createElement('div');
    grid.className = 'db-dp-month-panel-grid';

    const prevYearBtn = document.createElement('button');
    prevYearBtn.type = 'button';
    prevYearBtn.className = 'db-dp-month-panel-nav';
    prevYearBtn.textContent = '‹';
    prevYearBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.panelMode === 'years') {
        this.decadeStartYear -= 10;
        this.renderYearGrid(instance, grid, yearLabel);
      } else {
        this.monthPanelYear--;
        this.renderMonthGrid(instance, grid, yearLabel);
      }
    });

    const nextYearBtn = document.createElement('button');
    nextYearBtn.type = 'button';
    nextYearBtn.className = 'db-dp-month-panel-nav';
    nextYearBtn.textContent = '›';
    nextYearBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.panelMode === 'years') {
        this.decadeStartYear += 10;
        this.renderYearGrid(instance, grid, yearLabel);
      } else {
        this.monthPanelYear++;
        this.renderMonthGrid(instance, grid, yearLabel);
      }
    });

    header.append(prevYearBtn, yearLabel, nextYearBtn);
    panel.append(header, grid);
    instance.calendarContainer.appendChild(panel);
    this.monthPanelEl = panel;

    this.renderMonthGrid(instance, grid, yearLabel);
  }

  private renderMonthGrid(instance: flatpickr.Instance, grid: HTMLDivElement, yearLabel: HTMLSpanElement): void {
    yearLabel.textContent = String(this.monthPanelYear);
    grid.innerHTML = '';

    const nombresMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fechaSeleccionada = instance.selectedDates[0];

    nombresMes.forEach((nombre, index) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = nombre;
      boton.className = 'db-dp-month-panel-item';

      const esMesSeleccionado = !!fechaSeleccionada
        && fechaSeleccionada.getFullYear() === this.monthPanelYear
        && fechaSeleccionada.getMonth() === index;

      if (esMesSeleccionado) {
        boton.classList.add('db-dp-month-panel-item-selected');
      }

      boton.addEventListener('click', (event) => {
        event.stopPropagation();
        instance.jumpToDate(new Date(this.monthPanelYear, index, 1));
        this.closeMonthPanel();
      });

      grid.appendChild(boton);
    });
  }

  /** Vista de década (clic en el año dentro del panel de meses): muestra 12 celdas —
   * el año anterior y el posterior a la década en gris (igual que los días de otro mes en
   * la grilla de días), y los 10 años de la década en el medio. Clic en un año fija
   * monthPanelYear y vuelve a la grilla de meses. */
  private renderYearGrid(instance: flatpickr.Instance, grid: HTMLDivElement, yearLabel: HTMLSpanElement): void {
    const inicioDecada = this.decadeStartYear;
    yearLabel.textContent = `${inicioDecada}-${inicioDecada + 9}`;
    grid.innerHTML = '';
    grid.classList.remove('db-dp-month-panel-grid');
    grid.classList.add('db-dp-year-panel-grid');

    const fechaSeleccionada = instance.selectedDates[0];

    for (let offset = -1; offset <= 10; offset++) {
      const year = inicioDecada + offset;
      const fueraDeDecada = offset === -1 || offset === 10;

      const boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = String(year);
      boton.className = 'db-dp-month-panel-item db-dp-year-panel-item';
      if (fueraDeDecada) {
        boton.classList.add('db-dp-year-panel-item-outside');
      }

      if (fechaSeleccionada && fechaSeleccionada.getFullYear() === year) {
        boton.classList.add('db-dp-month-panel-item-selected');
      }

      boton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.monthPanelYear = year;
        this.panelMode = 'months';
        grid.classList.remove('db-dp-year-panel-grid');
        grid.classList.add('db-dp-month-panel-grid');
        this.renderMonthGrid(instance, grid, yearLabel);
      });

      grid.appendChild(boton);
    }
  }

  private closeMonthPanel(): void {
    if (!this.monthPanelEl) {
      return;
    }

    const calendarContainer = this.monthPanelEl.parentElement;
    const innerContainer = calendarContainer?.querySelector<HTMLElement>('.flatpickr-innerContainer');
    if (innerContainer) {
      innerContainer.style.display = '';
    }
    if (calendarContainer) {
      (calendarContainer as HTMLElement).style.minHeight = '';
    }

    this.monthPanelEl.remove();
    this.monthPanelEl = undefined;
  }

  private static injectMonthPanelStyles(): void {
    if (DbDatePickerComponent.monthPanelStylesInjected) {
      return;
    }
    DbDatePickerComponent.monthPanelStylesInjected = true;

    const style = document.createElement('style');
    style.setAttribute('data-db-date-picker', 'month-panel');
    style.textContent = `
      .db-dp-month-trigger { cursor: pointer; }
      .db-dp-month-panel {
        position: absolute !important;
        inset: 0 !important;
        z-index: 5 !important;
        background-color: #ffffff !important;
        border-radius: 12px;
        padding: 0.75rem;
        display: flex !important;
        flex-direction: column;
      }
      .dark .db-dp-month-panel { background-color: #101828 !important; }
      .db-dp-month-panel-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }
      .db-dp-month-panel-year {
        min-width: 4.5rem;
        text-align: center;
      }
      .db-dp-month-panel-nav {
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 1.125rem;
        line-height: 1;
        width: 1.75rem;
        height: 1.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border-radius: 0.375rem;
        color: #1f2937;
      }
      .dark .db-dp-month-panel-nav { color: #ffffff; }
      .db-dp-month-panel-nav:hover { background: #f3f4f6; }
      .dark .db-dp-month-panel-nav:hover { background: rgba(255, 255, 255, 0.05); }
      .db-dp-month-panel-year {
        font-size: 1.125rem;
        font-weight: 500;
        color: #1f2937;
      }
      .dark .db-dp-month-panel-year { color: #ffffff; }
      .db-dp-month-panel-year-trigger { cursor: pointer; border-radius: 0.375rem; padding: 0.125rem 0.5rem; }
      .db-dp-month-panel-year-trigger:hover { background: #f3f4f6; }
      .dark .db-dp-month-panel-year-trigger:hover { background: rgba(255, 255, 255, 0.05); }
      .db-dp-year-panel-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
        flex: 1;
      }
      .db-dp-year-panel-item-outside {
        opacity: 0.4;
      }
      .db-dp-month-panel-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        flex: 1;
      }
      .db-dp-month-panel-item {
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        background: transparent;
        color: #1f2937;
      }
      .dark .db-dp-month-panel-item { color: #ffffff; }
      .db-dp-month-panel-item:hover { background: #f9fafb; }
      .dark .db-dp-month-panel-item:hover { background: rgba(255, 255, 255, 0.05); }
      .db-dp-month-panel-item-selected,
      .db-dp-month-panel-item-selected:hover {
        background: #465fff !important;
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);
  }

  private setupScrollToChangeTime(instance: flatpickr.Instance): void {
    instance.calendarContainer.addEventListener(
      'wheel',
      (event: WheelEvent) => {
        const target = event.target as HTMLElement;
        const input = target.closest<HTMLInputElement>('.numInputWrapper input.numInput');

        if (!input || input.disabled) {
          return;
        }

        event.preventDefault();

        const wrapper = input.closest('.numInputWrapper');
        const arrow = wrapper?.querySelector<HTMLElement>(
          event.deltaY < 0 ? '.arrowUp' : '.arrowDown'
        );

        arrow?.click();
      },
      { passive: false }
    );
  }

  // Métodos de ControlValueAccessor
  writeValue(value: DbDatePickerInternalValue): void {
    if (value === null || value === undefined || value === '') {
      // form.reset() / setValue(null): limpiar lo visible sin emitir onChange.
      this.internalValue = '';
      this.formatError = false;
      this.manualEditPending = false;
      if (this.flatpickrInstance) {
        this.flatpickrInstance.clear(false);
        // clear(false) no dispara onValueUpdate, así que se refresca a mano (modo multiple).
        this.refreshMultipleDates();
      }
      return;
    }

    this.internalValue = value;
    if (this.flatpickrInstance) {
      this.setDateFromValue(value);
    }
  }

  registerOnChange(fn: DbDatePickerOnChangeFn): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: DbDatePickerOnTouchedFn): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;

    if (this.flatpickrInstance) {
      this.flatpickrInstance.set('clickOpens', !isDisabled);
    }
  }

  /** Combina el [error] explícito del padre (ej. "campo obligatorio") con el error de
   * formato detectado al tipear a mano, para que ambos casos pinten el borde en rojo. */
  get hasError(): boolean {
    return this.error || this.formatError;
  }

  get inputClasses(): string {
    let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30`;

    if (this.disabled) {
      inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed pointer-events-none dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    } else if (this.hasError) {
      inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
    } else {
      inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800`;
    }

    return inputClasses;
  }

  /** Mismas clases que el input, pero con alto mínimo en vez de fijo para que las fechas del
   * modo multiple puedan pasar a varias líneas. */
  get multipleDisplayClasses(): string {
    return `${this.inputClasses.replace('h-11', 'min-h-11 h-auto')} flex flex-wrap items-center gap-x-1 gap-y-0.5 ${
      this.disabled ? '' : 'cursor-pointer'
    }`;
  }

  private refreshMultipleDates(): void {
    const instance = this.flatpickrInstance;

    if (this.mode !== 'multiple' || !instance) {
      return;
    }

    const dateFormat = this.getDateFormat();
    this.multipleDates = instance.selectedDates.map((date) => instance.formatDate(date, dateFormat));
  }

  public openMultiple(): void {
    if (this.disabled) {
      return;
    }

    this.flatpickrInstance?.open();
  }

  get inputPaddingRight(): number | null {
    return this.showClearButton ? 5 : null;
  }

  get hasValue(): boolean {
    return !!this.dateInput?.nativeElement.value;
  }

  private getDateFormat(includeSeconds: boolean = false): string {
    switch (this.mode) {
      case 'range':
      case 'multiple':
        return this.dateOnlyFlatpickrFormat();
      case 'time':
        return includeSeconds ? 'H:i:S' : 'H:i';
      case 'datetime':
        return includeSeconds ? 'Y-m-d H:i:S' : 'Y-m-d H:i';
      default:
        return this.dateOnlyFlatpickrFormat();
    }
  }

  private dateOnlyFlatpickrFormat(): string {
    return this.format === 'dmy' ? 'd-m-Y' : 'Y-m-d';
  }

  private hasSecondsInValue(value: DbDatePickerValue | undefined): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    if (this.mode === 'time') {
      return TIME_FORMAT_REGEX.test(value) && value.split(':').length === 3;
    }

    if (this.mode === 'datetime') {
      const parts = matchDateTime(value);
      return !!parts && parts.seconds !== undefined;
    }

    return false;
  }

  private applyInputValue(value: DbDatePickerValue): void {
    if (!this.flatpickrInstance) {
      return;
    }

    if (this.mode === 'single') {
      if (typeof value !== 'string' && !(value instanceof Date)) {
        console.error('DbDatePickerComponent: en modo "single", value debe ser string o Date.');
        return;
      }

      const date = this.toDate(value);
      if (date) {
        this.flatpickrInstance.setDate(date);
      }
      return;
    }

    if (this.mode === 'multiple') {
      if (!Array.isArray(value)) {
        console.error('DbDatePickerComponent: en modo "multiple", value debe ser string[] o Date[].');
        return;
      }

      const dates = value
        .map((item) => this.toDate(item))
        .filter((date): date is Date => date !== null);

      if (dates.length) {
        this.flatpickrInstance.setDate(dates);
      }
      return;
    }

    if (this.mode === 'range') {
      if (Array.isArray(value) || typeof value !== 'object' || !('startDate' in value) || !('endDate' in value)) {
        console.error(
          'DbDatePickerComponent: en modo "range", value debe ser { startDate, endDate }.'
        );
        return;
      }

      const range = value as DbDatePickerRangeValue;
      const startDate = this.toDate(range.startDate);
      const endDate = this.toDate(range.endDate);

      if (startDate && endDate) {
        this.flatpickrInstance.setDate([startDate, endDate]);
      }
      return;
    }

    if (this.mode === 'time') {
      if (typeof value !== 'string') {
        console.error('DbDatePickerComponent: en modo "time", value debe ser string.');
        return;
      }

      const date = this.parseTimeString(value);
      if (date) {
        this.flatpickrInstance.setDate(date);
      }
      return;
    }

    if (this.mode === 'datetime') {
      if (typeof value !== 'string' && !(value instanceof Date)) {
        console.error('DbDatePickerComponent: en modo "datetime", value debe ser string o Date.');
        return;
      }

      const date = value instanceof Date ? value : this.parseDateTimeString(value);
      if (date) {
        this.flatpickrInstance.setDate(date);
      }
    }
  }

  private toDate(value: string | Date): Date | null {
    if (value instanceof Date) {
      return value;
    }

    return this.parseDateString(value);
  }

  /** Parsea (en hora local) una fecha en el formato configurado con "-" (YYYY-MM-DD o
   * DD-MM-YYYY), o bien 'DD/MM/YYYY' con "/" (siempre día-primero, locale es). */
  private parseDateString(value: string): Date | null {
    const esDmy = this.format === 'dmy';
    const pattern = esDmy ? /^(\d{2})-(\d{2})-(\d{4})$/ : /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = value.match(pattern);
    const slashMatch = match ? null : value.match(DATE_DMY_SLASH_REGEX);

    let day: string;
    let month: string;
    let year: string;

    if (match) {
      const [, p1, p2, p3] = match;
      [day, month, year] = esDmy ? [p1, p2, p3] : [p3, p2, p1];
    } else if (slashMatch) {
      [, day, month, year] = slashMatch;
    } else {
      const formatoEsperado = esDmy ? 'dd-mm-YYYY' : 'YYYY-mm-dd';
      console.error(
        `DbDatePickerComponent: "${value}" no respeta el formato ${formatoEsperado} ni dd/mm/YYYY.`
      );
      return null;
    }

    const date = new Date(Number(year), Number(month) - 1, Number(day));

    const isRealDate =
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day);

    if (!isRealDate) {
      console.error(`DbDatePickerComponent: "${value}" no es una fecha válida.`);
      return null;
    }

    return date;
  }

  private parseDateTimeString(value: string): Date | null {
    const parts = matchDateTime(value);

    if (!parts) {
      console.error(
        `DbDatePickerComponent: "${value}" no respeta el formato dd/mm/YYYY HH:mm[:ss] ni YYYY-MM-DD HH:mm[:ss].`
      );
      return null;
    }

    const { day, month, year, hours, minutes, seconds } = parts;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      seconds ? Number(seconds) : 0
    );

    const isRealDate =
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day);

    if (!isRealDate) {
      console.error(`DbDatePickerComponent: "${value}" no es una fecha válida.`);
      return null;
    }

    return date;
  }

  private parseTimeString(value: string): Date | null {
    const match = value.match(TIME_FORMAT_REGEX);

    if (!match) {
      console.error(`DbDatePickerComponent: "${value}" no respeta el formato HH:mm o HH:mm:ss.`);
      return null;
    }

    const [, hours, minutes, seconds] = match;
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), seconds ? Number(seconds) : 0, 0);

    return date;
  }

  private setDateFromValue(value: DbDatePickerInternalValue): void {
    try {
      if (
        (this.mode === 'range' && Array.isArray(value) && value.length === 2) ||
        (this.mode === 'multiple' && Array.isArray(value))
      ) {
        const dates = value
          .map((v) => this.parseFormValueDate(v))
          .filter((date): date is Date => date !== null);
        this.flatpickrInstance?.setDate(dates);
      } else if (typeof value === 'string' && this.mode === 'single') {
        const date = this.parseFormValueDate(value);
        if (date) {
          this.flatpickrInstance?.setDate(date);
        }
      } else if (typeof value === 'string' && this.mode === 'datetime') {
        const date = this.parseDateTimeString(value);
        if (date && this.flatpickrInstance) {
          const showSeconds = this.hasSecondsInValue(value);
          this.flatpickrInstance.set('enableSeconds', showSeconds);
          this.flatpickrInstance.set('dateFormat', this.getDateFormat(showSeconds));
          this.flatpickrInstance?.setDate(date);
        }
      } else if (typeof value === 'string') {
        this.flatpickrInstance?.setDate(value);
      } else if (value instanceof Date) {
        this.flatpickrInstance?.setDate(value);
      }
    } catch (error) {
      console.error('Error setting date in DbDatePickerComponent:', error);
    }
  }

  /** Convierte un elemento del valor del formulario a Date: Date tal cual; strings ISO
   * completos (con 'T', formato emitido por versiones anteriores) vía new Date(); el resto
   * con parseDateString (fecha local en el formato configurado, o dd/mm/YYYY). */
  private parseFormValueDate(value: string | Date): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (value.includes('T')) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    return this.parseDateString(value);
  }

  ngOnDestroy() {
    this.destroyed = true;

    if (this.flatpickrInstance && typeof this.flatpickrInstance.destroy === 'function') {
      this.flatpickrInstance.destroy();
    }
    this.flatpickrInstance = undefined;
    this.monthPanelEl = undefined;
  }

  public clear(): void {
    this.flatpickrInstance?.clear();
    this.internalValue = '';
    this.onChange('');
    this.onTouched();
  }
}
