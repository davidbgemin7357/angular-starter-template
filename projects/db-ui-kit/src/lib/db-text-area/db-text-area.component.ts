import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'db-text-area',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './db-text-area.component.html',
  styleUrl: './db-text-area.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbTextAreaComponent),
      multi: true
    }
  ]
})
export class DbTextAreaComponent implements ControlValueAccessor {
  @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;

  @Input() label?: string;
  @Input() required: boolean = false;
  @Input() placeholder = 'Ingresa tu mensaje';
  @Input() rows: number = 3;
  @Input() className: string = "";
  @Input() disabled: boolean = false;
  @Input() error: boolean = false;
  @Input() hint: string = "";
  @Input() maxLength?: number = 1000;
  @Input() minLength?: number = 0;
  @Input() showClearButton: boolean = false;
  /** Caracteres permitidos: cada carácter se valida por separado (igual que en DbTextBox).
   * Los saltos de línea siempre se conservan para no romper el texto multilínea. */
  @Input() regexp?: RegExp | string;

  value: string = "";

  @Output() valueChange = new EventEmitter<string>();

  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  // Angular escribe el valor aquí
  writeValue(value: string): void {
    this.value = value ?? "";
  }

  // Angular registra el cambio
  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  // Angular registra el touched
  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  // Angular controla disabled
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const val = this.regexp ? this.filterValueByRegexp(textarea.value) : textarea.value;

    if (val !== textarea.value) {
      textarea.value = val;
    }

    this.value = val;

    // actualizar formulario
    this.onChangeFn(val);
    this.onTouchedFn();

    // mantener compatibilidad con tu output
    this.valueChange.emit(val);
  }

  private filterValueByRegexp(value: string): string {
    const regexp = this.getRegexp();

    if (!regexp) {
      return value;
    }

    return Array.from(value)
      .filter((character) => {
        if (character === '\n') {
          return true;
        }
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

  get textareaClasses(): string {
    let base = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden ${this.className} `;

    if (this.disabled) {
      base += 'bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    } else if (this.error) {
      base +=
        'bg-transparent border-error-500 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-error-500 dark:bg-gray-900 dark:text-white/90 dark:focus:border-error-800';
    } else {
      base +=
        'bg-transparent text-gray-900 dark:text-gray-300 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800';
    }

    return base;
  }

  get textareaPaddingRight(): number | null {
    return this.showClearButton ? 2.75 : null;
  }

  public clearValue(): void {
    if (this.disabled) {
      return;
    }

    this.value = '';

    if (this.textareaRef) {
      this.textareaRef.nativeElement.focus();
    }

    this.onChangeFn('');
    this.onTouchedFn();
    this.valueChange.emit('');
  }
}
