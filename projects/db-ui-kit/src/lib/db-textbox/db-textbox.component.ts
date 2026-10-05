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
import { DbTextBoxType } from './db-textbox.types';
import { TextBoxOnChangeFn, TextBoxOnTouchedFn } from './db-textbox.interface';

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'db-text-box',
  imports: [CommonModule],
  templateUrl: './db-textbox.component.html',
  styleUrl: './db-textbox.component.css',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbTextBoxComponent),
      multi: true,
    },
  ],
})
export class DbTextBoxComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  @Input() type: DbTextBoxType = 'text';
  @Input() id?: string = '';
  @Input() name?: string = '';
  @Input() label?: string = '';
  @Input() placeholder?: string = '';
  @Input() value: string = '';
  @Input() maxLength?: number = 1000;
  @Input() minLength?: number = 0;
  @Input() disabled: boolean = false;
  @Input() success: boolean = false;
  @Input() error: boolean = false;
  @Input() hint?: string;
  @Input() className: string = '';
  @Input() required: boolean = false;
  @Input() regexp?: RegExp | string;
  @Input() showClearButton: boolean = false;
  @Input() icon?: string;

  @Output() valueChange = new EventEmitter<string>();

  isPasswordVisible = false;

  /** true cuando type="email" y, al salir del campo, el texto no tiene formato de correo
   * válido. Se valida internamente (sin necesidad de pasar [regexp]) y se limpia apenas el
   * usuario vuelve a escribir, igual que el formatError de DbDatePickerComponent. */
  public emailFormatError = false;

  onChange: TextBoxOnChangeFn = () => {};
  onTouched: TextBoxOnTouchedFn = () => {};

  ngAfterViewInit(): void {
    // Setea el valor inicial directamente en el DOM
    if (this.inputRef && this.value != null && this.value !== '') {
      this.inputRef.nativeElement.value = String(this.value);
    }
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.emailFormatError = false;
    // Actualiza el DOM directamente, sin pasar por binding
    if (this.inputRef) {
      this.inputRef.nativeElement.value = value != null ? String(value) : '';
    }
  }

  registerOnChange(fn: TextBoxOnChangeFn): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: TextBoxOnTouchedFn): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Combina el [error] explícito del padre con el error de formato detectado internamente
   * para type="email", sin pisar el control que ya tenían los demás tipos. */
  get computedError(): boolean {
    return this.error || this.emailFormatError;
  }

  /** Mensaje de formato inválido cuando no hay [hint] explícito del padre. */
  get computedHint(): string | undefined {
    if (this.emailFormatError && !this.hint) {
      return 'Ingresa un correo electrónico válido.';
    }

    return this.hint;
  }

  get inputClasses(): string {
    let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${this.className}`;

    if (this.disabled) {
      inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    } else if (this.computedError) {
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

    this.emailFormatError = false;

    if (this.regexp) {
      const value = this.filterValueByRegexp(input.value);

      input.value = value;
      this.value = value;
      this.onChange(value);
      this.valueChange.emit(value);
    } else {
      this.value = input.value;
      this.onChange(input.value);
      this.valueChange.emit(input.value);
    }
  }

  /** Valida el formato de correo al salir del campo — no bloquea mientras se escribe, para
   * no marcar error por cada tecla (igual que el blur de DbDatePickerComponent). */
  public handleBlur(): void {
    if (this.type === 'email') {
      const value = this.value?.trim() ?? '';
      this.emailFormatError = value.length > 0 && !EMAIL_FORMAT_REGEX.test(value);
    }

    this.onTouched();
  }

  private filterValueByRegexp(value: string): string {
    const regexp = this.getRegexp();

    if (!regexp) {
      return value;
    }

    return Array.from(value)
      .filter((character) => {
        regexp.lastIndex = 0;
        return regexp.test(character);
      })
      .join('');
  }

  private getRegexp(): RegExp | null {
    if (this.regexp instanceof RegExp) {
      return this.regexp;
    }

    if (!this.regexp) {
      return null;
    }

    try {
      return new RegExp(this.regexp);
    } catch {
      return null;
    }
  }

  get inputType(): string {
    if (this.type === 'password') {
      return this.isPasswordVisible ? 'text' : 'password';
    }

    return this.type;
  }

  get inputPaddingRight(): number | null {
    if (this.showClearButton && this.type === 'password') {
      return 5.5;
    }

    if (this.showClearButton) {
      return 3.25;
    }

    if (this.type === 'password') {
      return 3.25;
    }

    return null;
  }

  get clearButtonRightOffset(): number {
    if (this.type === 'password') {
      return 3;
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
    this.emailFormatError = false;

    if (this.inputRef) {
      this.inputRef.nativeElement.value = '';
      this.inputRef.nativeElement.focus();
    }

    this.onChange('');
    this.valueChange.emit('');
    this.onTouched();
  }

  public togglePasswordVisibility(): void {
    if (this.disabled) {
      return;
    }

    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
