import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { Option } from './db-selectbox.interface';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const DROPDOWN_MAX_HEIGHT = 288;

interface DropdownPosition {
  left: string;
  width: string;
  top?: string;
  bottom?: string;
}

@Component({
  selector: 'db-select-box',
  imports: [CommonModule],
  templateUrl: './db-selectbox.component.html',
  styleUrl: './db-selectbox.component.css',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbSelectBoxComponent),
      multi: true,
    },
  ],
})
export class DbSelectBoxComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() id?: string = '';
  @Input() options: Option[] = [];
  @Input() placeholder: string = 'Selecciona una opción';
  @Input() className: string = '';
  @Input() defaultValue: string = '';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() optionSelected = new EventEmitter<string | number>();
  @Input() success: boolean = false;
  @Input() error: boolean = false;
  @Input() required: boolean = true;
  @Input() hint?: string;
  @Input() label?: string;
  @Input() showClearButton: boolean = false;
  /** Si es true, la lista despliega una opción "{{placeholder}}" que permite volver al
   * estado sin selección. Si es false, esa opción no aparece y el valor seleccionado por
   * defecto (Input `value`) se muestra directamente, sin posibilidad de dejarlo vacío. */
  @Input() allowEmptyOptionSelect: boolean = true;
  @Input() allowSearch: boolean = false;
  @Input() searchPlaceholder: string = 'Buscar...';

  isOpen: boolean = false;
  public searchTerm: string = '';
  public dropdownPosition: DropdownPosition = { left: '0px', width: '0px' };

  @ViewChild('triggerRef') private triggerRef!: ElementRef<HTMLElement>;

  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  /** Se registra con `capture: true` porque el scroll del contenedor que envuelve el
   * select-box (ej. el body con overflow-y-auto de db-modal) no burbujea hasta window. Cierra
   * el desplegable para no dejarlo con una posición `fixed` desactualizada respecto al
   * trigger — mismo criterio que DbMultiSelectComponent. Ignora el scroll cuyo origen está
   * DENTRO del propio componente (ej. la lista de opciones, cuando tiene más ítems de los que
   * entran en max-h-60 y hay que desplazarla para llegar a las últimas opciones) — sin este
   * chequeo, ese scroll interno cerraba el desplegable antes de poder hacer clic en una opción
   * al final de la lista (ej. "Domingo" en un select de día de la semana). */
  private readonly closeOnScroll = (event: Event): void => {
    if (!this.isOpen) return;
    const target = event.target as Node | null;
    if (target && this.elementRef.nativeElement.contains(target)) {
      return;
    }
    this.closeDropdown();
  };

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    document.addEventListener('scroll', this.closeOnScroll, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.closeOnScroll, true);
  }

  ngOnChanges() {
    if (!this.value && this.defaultValue) {
      this.value = this.defaultValue;
    }

    if (this.value && !this.isOptionActive(this.value)) {
      this.value = '';
      this.onChangeFn('');
      this.onTouchedFn();
      this.valueChange.emit('');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }

  // Cierra el desplegable cuando el foco sale del componente por completo (ej. Tab), no solo
  // al hacer click afuera — focusout burbujea y expone relatedTarget, a diferencia de blur.
  // Si el foco se mueve a otro elemento DENTRO del propio componente (botón limpiar, opciones
  // de la lista, input de búsqueda), no se cierra.
  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as Node | null;
    if (!relatedTarget || !this.elementRef.nativeElement.contains(relatedTarget)) {
      this.closeDropdown();
    }
  }

  public onSearchTermChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  get filteredOptions(): Option[] {
    if (!this.allowSearch || !this.searchTerm.trim()) {
      return this.options;
    }

    const term = this.searchTerm.trim().toLowerCase();
    return this.options.filter(option => option.name.toLowerCase().includes(term));
  }

  get selectedOption(): Option | undefined {
    return this.options.find((option) => String(option.code) === this.value);
  }

  get selectedOptionStyle(): string {
    return this.selectedOption ? this.getOptionColor(this.selectedOption) : '';
  }

  get hasSelectedColor(): boolean {
    return !!this.selectedOptionStyle;
  }

  toggleDropdown(): void {
    if (this.disabled) return;

    if (this.isOpen) {
      this.closeDropdown();
      return;
    }

    this.isOpen = true;
    this.updateDropdownPosition();
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchTerm = '';
  }

  /** Posiciona el desplegable con `position: fixed` (coordenadas de viewport) en lugar de
   * `absolute`, para que no aumente el scrollHeight del contenedor con overflow-y-auto que lo
   * envuelve (ej. el body de db-modal) — sin esto, el desplegable empujaba el contenido del
   * modal y generaba scroll en vez de superponerse. Mismo criterio que
   * DbMultiSelectComponent.updateDropdownPosition(). Si no hay espacio suficiente debajo del
   * trigger, se abre hacia arriba. */
  private updateDropdownPosition(): void {
    if (!this.triggerRef) {
      return;
    }

    const rect = this.triggerRef.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const left = `${rect.left}px`;
    const width = `${rect.width}px`;

    if (spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > spaceBelow) {
      this.dropdownPosition = { left, width, bottom: `${window.innerHeight - rect.top + 4}px` };
    } else {
      this.dropdownPosition = { left, width, top: `${rect.bottom + 4}px` };
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.updateDropdownPosition();
    }
  }

  selectOption(option: Option): void {
    if (option.active === false) return;

    const value = String(option.code);
    this.value = value;
    this.onChangeFn(value);
    this.onTouchedFn();
    this.valueChange.emit(value);
    this.optionSelected.emit(option.code);
    this.closeDropdown();
  }

  get selectClasses(): string[] {
    return [
      this.className,
      this.value ? 'text-gray-800 dark:text-white/90' : 'text-gray-400 dark:text-white/30',
      this.disabled
        ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60 border-gray-200 dark:border-gray-700'
        : '',
      this.error && !this.disabled
        ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
        : '',
      this.success && !this.disabled && !this.error
        ? 'border-success-500 focus:border-success-500 focus:ring-success-500/20'
        : '',
      !this.disabled && !this.error && !this.success
        ? 'bg-transparent border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'
        : '',
    ];
  }

  public writeValue(value: string): void {
    this.value = value ?? '';
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get showHintContainer(): boolean {
    return !!(this.hint || this.error || this.success);
  }

  clearValue(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.value = '';
    this.onChangeFn('');
    this.onTouchedFn();
    this.valueChange.emit('');
    this.optionSelected.emit('');
    this.closeDropdown();
  }

  getOptionColor(option: Option): string {
    if (option.active !== true) {
      return '';
    }

    switch (option.color) {
      case 'success':
        return 'option-color-success';
      case 'warning':
        return 'option-color-warning';
      case 'danger':
        return 'option-color-danger';
      default:
        return '';
    }
  }

  private isOptionActive(value: string): boolean {
    const option = this.options.find((item) => String(item.code) === value);
    return option?.active !== false;
  }
}
