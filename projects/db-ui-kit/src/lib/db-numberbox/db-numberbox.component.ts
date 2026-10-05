import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NumberBoxOnChangeFn, NumberBoxOnTouchedFn } from './db-numberbox.interface';

@Component({
  selector: 'db-numberbox',
  imports: [CommonModule],
  templateUrl: './db-numberbox.component.html',
  styleUrl: './db-numberbox.component.css',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbNumberBoxComponent),
      multi: true,
    },
  ],
})
export class DbNumberBoxComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  @Input() id?: string = '';
  @Input() name?: string = '';
  @Input() label?: string = '';
  @Input() placeholder?: string = '';
  @Input() value: string | number = '';
  @Input() min?: string;
  @Input() max?: string;
  @Input() step?: number;
  /** Cantidad de decimales permitidos. 0 o sin definir => solo enteros. */
  @Input() decimals?: number;
  @Input() disabled: boolean = false;
  @Input() success: boolean = false;
  @Input() error: boolean = false;
  @Input() hint?: string;
  @Input() className: string = '';
  @Input() required: boolean = false;
  @Input() showClearButton: boolean = false;
  @Input() icon?: string;

  @Output() valueChange = new EventEmitter<string | number>();

  onChange: NumberBoxOnChangeFn = () => {};
  onTouched: NumberBoxOnTouchedFn = () => {};

  ngAfterViewInit(): void {
    // Setea el valor inicial directamente en el DOM
    if (this.inputRef && this.value != null && this.value !== '') {
      this.inputRef.nativeElement.value = String(this.value);
    }
  }

  writeValue(value: string | number | null): void {
    this.value = value ?? '';
    // Actualiza el DOM directamente, sin pasar por binding
    if (this.inputRef) {
      this.inputRef.nativeElement.value = value != null ? String(value) : '';
    }
  }

  registerOnChange(fn: NumberBoxOnChangeFn): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: NumberBoxOnTouchedFn): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get inputClasses(): string {
    let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${this.className}`;

    if (this.disabled) {
      inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    } else if (this.error) {
      inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
    } else if (this.success) {
      inputClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
    } else {
      inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
    }
    return inputClasses;
  }

  public onInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    let value = input.value;

    // Limpia caracteres inválidos
    value = value.replace(/[^0-9.,\-]/g, '');

    // Normaliza coma a punto para decimales
    value = value.replace(',', '.');

    // Solo permite un punto decimal
    let parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
      parts = value.split('.');
    }

    // Valida la cantidad de decimales
    // Solo valida si decimals está explícitamente especificado
    if (this.decimals !== undefined) {
      const maxDecimals = this.decimals;
      if (parts.length > 1 && parts[1]) {
        const decimalPart = parts[1];
        if (decimalPart.length > maxDecimals) {
          value = parts[0] + (maxDecimals > 0 ? '.' + decimalPart.slice(0, maxDecimals) : '');
        }
      } else if (maxDecimals === 0 && parts.length > 1) {
        // Si decimals es 0 explícitamente, no permite punto decimal
        value = parts[0];
      }
    } else {
      // Por defecto (si decimals no está definido), no permite decimales
      // Solo elimina el punto si no hay dígitos después
      if (parts.length > 1 && !parts[1]) {
        // Solo punto sin decimales, lo eliminamos
        value = parts[0];
      }
    }

    // Solo permite un signo negativo al inicio
    const minusCount = (value.match(/-/g) || []).length;
    if (minusCount > 1) {
      value = value.replace(/-/g, '');
    }
    if (value.indexOf('-') > 0) {
      value = value.replace(/-/g, '');
    }

    // Aplica límite máximo
    if (this.max !== undefined && value !== '' && value !== '-' && value !== '.') {
      const max = Number(this.max);
      const num = Number(value);
      if (num > max) {
        value = String(max);
      }
    }

    // El mínimo NO se aplica al tipear: con min=10, escribir "25" pasa por "2" (menor que el
    // mínimo) y se convertía en "10" → "105". Se aplica al salir del campo (onBlur).

    // Actualiza el DOM directamente para preservar "1." o "1,"
    input.value = value;

    // Detecta si está en estado "decimal incompleto"
    const isIncompleteDecimal =
      value.endsWith('.') || value.endsWith(',') || value === '-' || value === '';

    let finalValue: string | number;

    if (isIncompleteDecimal) {
      // Mantiene string para no romper lo que el usuario escribe
      finalValue = value;
    } else {
      finalValue = Number(value);
    }

    this.value = finalValue;
    this.onChange(finalValue);
    this.valueChange.emit(finalValue);
  }

  /** Al salir del campo: marca touched y, si el valor quedó por debajo de `min`, lo lleva a `min`. */
  public onBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;

    if (this.min !== undefined && typeof this.value === 'number') {
      const min = Number(this.min);
      if (this.value < min) {
        this.value = min;
        input.value = String(min);
        this.onChange(min);
        this.valueChange.emit(min);
      }
    }

    this.onTouched();
  }

  get hasValue(): boolean {
    return this.value !== '' && this.value !== null && this.value !== undefined;
  }

  get inputMode(): string {
    return this.decimals !== undefined && this.decimals > 0 ? 'decimal' : 'numeric';
  }

  get inputPaddingRight(): number | null {
    if (this.showClearButton && this.step) {
      return 4.75;
    }

    if (this.showClearButton) {
      return 3.25;
    }

    if (this.step) {
      return 2.5;
    }

    return null;
  }

  get clearButtonRightOffset(): number {
    if (this.step) {
      return 1.75;
    }

    return 0.3125;
  }

  get inputPaddingLeft(): number | null {
    return this.icon ? 3.875 : null;
  }

  public clearValue(): void {
    if (this.disabled) {
      return;
    }

    this.value = '';

    if (this.inputRef) {
      this.inputRef.nativeElement.value = '';
      this.inputRef.nativeElement.focus();
    }

    this.onChange('');
    this.valueChange.emit('');
    this.onTouched();
  }

  public incrementValue(): void {
    if (!this.step || this.disabled) return;
    const input = this.inputRef.nativeElement;
    const currentValue = input.value.trim() === '' ? 0 : Number(input.value);
    if (isNaN(currentValue)) return;

    this.updateValue(currentValue + this.step);
  }

  public decrementValue(): void {
    if (!this.step || this.disabled) return;
    const input = this.inputRef.nativeElement;
    const currentValue = input.value.trim() === '' ? 0 : Number(input.value);
    if (isNaN(currentValue)) return;

    this.updateValue(currentValue - this.step);
  }

  private updateValue(newValue: number): void {
    // Aplica límites
    if (this.max !== undefined && newValue > Number(this.max)) {
      newValue = Number(this.max);
    }
    if (this.min !== undefined && newValue < Number(this.min)) {
      newValue = Number(this.min);
    }

    // Formatea el valor
    let formattedValue: string;
    if (this.decimals !== undefined && this.decimals > 0) {
      formattedValue = newValue.toFixed(this.decimals);
    } else {
      formattedValue = String(Math.round(newValue));
    }

    this.inputRef.nativeElement.value = formattedValue;
    this.value = Number(formattedValue);
    this.onChange(Number(formattedValue));
    this.valueChange.emit(Number(formattedValue));
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (!this.step) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const currentValue = input.value.trim();
    let numValue = currentValue === '' ? 0 : Number(currentValue);

    if (isNaN(numValue)) {
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      numValue += this.step;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      numValue -= this.step;
    } else {
      return;
    }

    // Aplica límites
    if (this.max !== undefined) {
      const max = Number(this.max);
      if (numValue > max) {
        numValue = max;
      }
    }
    if (this.min !== undefined) {
      const min = Number(this.min);
      if (numValue < min) {
        numValue = min;
      }
    }

    // Formatea el valor si hay decimales
    let formattedValue: string;
    if (this.decimals !== undefined && this.decimals > 0) {
      formattedValue = numValue.toFixed(this.decimals);
    } else {
      formattedValue = String(Math.round(numValue));
    }

    input.value = formattedValue;
    this.value = Number(formattedValue);
    this.onChange(Number(formattedValue));
    this.valueChange.emit(Number(formattedValue));
  }
}
