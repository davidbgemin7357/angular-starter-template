import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { Option } from './db-multi-select.interface';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const DEFAULT_OPTION_IMAGE_SIZE = 100;
const DROPDOWN_MAX_HEIGHT = 256;

interface DropdownPosition {
  left: string;
  width: string;
  top?: string;
  bottom?: string;
}

@Component({
  selector: 'db-multi-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './db-multi-select.component.html',
  styles: ``,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbMultiSelectComponent),
      multi: true
    }
  ]
})
export class DbMultiSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() label: string = '';
  @Input() options: Option[] = [];
  @Input() disabled: boolean = false;
  @Input() placeholder: string = "Seleccione una o más opciones";
  @Input() required: boolean = false;
  @Input() showClearButton: boolean = false;
  @Input() allowSearch: boolean = false;
  @Input() searchPlaceholder: string = 'Buscar...';

  @Output() selectionChange = new EventEmitter<(number | string)[]>();
  @Output() valueChange = new EventEmitter<Option[]>();

  @ViewChild('triggerRef') triggerRef!: ElementRef<HTMLElement>;

  public selectedOptions: (number | string)[] = [];
  public isOpen: boolean = false;
  public dropdownPosition: DropdownPosition = { left: '0px', width: '0px' };
  public searchTerm: string = '';


  // ControlValueAccessor
  private onChange: (value: (number | string)[]) => void = () => {};
  private onTouched: () => void = () => {};

  /** Se registra con `capture: true` porque el scroll del formulario contenedor (que tiene
   * overflow-y-auto) no burbujea hasta window. Cierra el dropdown para no dejarlo con una
   * posición `fixed` desactualizada respecto al trigger. Ignora el scroll cuyo origen está
   * DENTRO del propio componente (ej. la lista de opciones larga) — sin este chequeo, ese
   * scroll interno cerraba el desplegable antes de poder hacer clic en una opción al final
   * de la lista. */
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
      this.onTouched();
    }
  }

  // Angular escribe el valor aquí
  writeValue(value: (number | string)[]): void {
    this.selectedOptions = value || [];
  }

  registerOnChange(fn: (value: (number | string)[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public toggleDropdown(): void {
    if (this.disabled) {
      return;
    }

    if (this.isOpen) {
      this.closeDropdown();
      return;
    }

    this.isOpen = true;
    this.onTouched();
    this.updateDropdownPosition();
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.searchTerm = '';
  }

  public onSearchTermChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  get filteredOptions(): Option[] {
    if (!this.allowSearch || !this.searchTerm.trim()) {
      return this.options;
    }

    const term = this.searchTerm.trim().toLowerCase();
    return this.options.filter(option => option.text.toLowerCase().includes(term));
  }

  /** Posiciona el dropdown con `position: fixed` (coordenadas de viewport) en lugar de
   * `absolute`, para que no aumente el scrollHeight del contenedor con overflow-y-auto que lo
   * envuelve (eso hacía aparecer una barra de scroll cada vez que se abría el desplegable). Si
   * no hay espacio suficiente debajo del trigger, se abre hacia arriba. */
  private updateDropdownPosition(): void {
    if (!this.triggerRef) {
      return;
    }

    const rect = this.triggerRef.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const left = `${rect.left}px`;
    const width = `${rect.width}px`;

    if (spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > spaceBelow) {
      this.dropdownPosition = { left, width, bottom: `${window.innerHeight - rect.top + 8}px` };
    } else {
      this.dropdownPosition = { left, width, top: `${rect.bottom + 8}px` };
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.updateDropdownPosition();
    }
  }

  public handleSelect(optionValue: number | string): void {
    if (this.selectedOptions.includes(optionValue)) {
      this.selectedOptions = this.selectedOptions.filter(v => v !== optionValue);
    } else {
      this.selectedOptions = [...this.selectedOptions, optionValue];
    }

    // 🔥 IMPORTANTE: notificar al form
    this.onChange(this.selectedOptions);

    // evento opcional
    this.selectionChange.emit(this.selectedOptions);
    this.valueChange.emit(this.selectedOptionItems);
  }

  public removeOption(value: number | string): void {
    if (this.disabled) {
      return;
    }

    this.selectedOptions = this.selectedOptions.filter(opt => opt !== value);

    this.onChange(this.selectedOptions);
    this.selectionChange.emit(this.selectedOptions);
    this.valueChange.emit(this.selectedOptionItems);
  }

  public clearAll(event: Event): void {
    event.stopPropagation();

    if (this.disabled) {
      return;
    }

    this.selectedOptions = [];
    this.onChange(this.selectedOptions);
    this.onTouched();
    this.selectionChange.emit(this.selectedOptions);
    this.valueChange.emit(this.selectedOptionItems);
  }

  get selectedValuesText(): string[] {
    return this.selectedOptions
      .map(value => this.options.find(option => option.code === value)?.text || '')
      .filter(Boolean);
  }

  get selectedOptionItems(): Option[] {
    return this.selectedOptions
      .map(value => this.options.find(option => option.code === value))
      .filter((option): option is Option => !!option);
  }

  public isOptionSelected(value: number | string): boolean {
    return this.selectedOptions.includes(value);
  }

  public getOptionWidth(option: Option): number {
    return option.width ?? DEFAULT_OPTION_IMAGE_SIZE;
  }

  public getOptionHeight(option: Option): number {
    return option.height ?? DEFAULT_OPTION_IMAGE_SIZE;
  }
}
