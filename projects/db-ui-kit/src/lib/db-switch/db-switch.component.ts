import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DbSwitchColor } from './db-switch.types';

@Component({
  selector: 'db-switch',
  imports: [CommonModule],
  templateUrl: './db-switch.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbSwitchComponent),
      multi: true,
    },
  ],
})
export class DbSwitchComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() disabled: boolean = false;
  @Input() color: DbSwitchColor = 'blue';
  @Input() isChecked: boolean = false;

  @Output() valueChange = new EventEmitter<boolean>();

  private onChangeFn: (value: boolean) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(value: boolean): void {
    this.isChecked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onToggle(event: Event): void {
    if (this.disabled) return;

    const input = event.target as HTMLInputElement;
    this.isChecked = input.checked;
    this.onChangeFn(this.isChecked);
    this.onTouchedFn();
    this.valueChange.emit(this.isChecked);
  }

  get switchColors() {
    // Deshabilitado: pista gris sólida si está activado, para que se distinga del apagado.
    if (this.disabled) {
      return {
        background: this.isChecked
          ? 'bg-gray-400 dark:bg-gray-600'
          : 'bg-gray-100 dark:bg-gray-800',
        knob: this.isChecked
          ? 'translate-x-full bg-white'
          : 'translate-x-0 bg-white',
      };
    }

    if (this.color === 'blue') {
      return {
        background: this.isChecked
          ? 'bg-brand-500'
          : 'bg-gray-200 dark:bg-white/10',
        knob: this.isChecked
          ? 'translate-x-full bg-white'
          : 'translate-x-0 bg-white',
      };
    } else {
      return {
        background: this.isChecked
          ? 'bg-gray-800 dark:bg-white/10'
          : 'bg-gray-200 dark:bg-white/10',
        knob: this.isChecked
          ? 'translate-x-full bg-white'
          : 'translate-x-0 bg-white',
      };
    }
  }
}
