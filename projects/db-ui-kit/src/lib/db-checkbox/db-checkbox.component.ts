import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CheckboxPicture } from './db-checkbox.interface';

const DEFAULT_PICTURE_SIZE = 100;

@Component({
  selector: 'db-checkbox',
  imports: [CommonModule],
templateUrl: './db-checkbox.component.html',
  styles: ``,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbCheckboxComponent),
      multi: true,
    },
  ],
})
export class DbCheckboxComponent implements ControlValueAccessor {

  @Input() label?: string;
  @Input() text?: string;
  @Input() picture?: CheckboxPicture;
  @Input() htmlContent?: string;
  @Input() checked = false;
  @Input() className = '';
  @Input() id?: string;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<boolean>();

  private onChangeFn: (value: boolean) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked = !!value;
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

  onChange(event: Event) {
    if (this.disabled) {
      return;
    }

    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.onChangeFn(this.checked);
    this.onTouchedFn();
    this.valueChange.emit(this.checked);
  }

  get pictureWidth(): number {
    return this.picture?.width ?? DEFAULT_PICTURE_SIZE;
  }

  get pictureHeight(): number {
    return this.picture?.height ?? DEFAULT_PICTURE_SIZE;
  }
}
