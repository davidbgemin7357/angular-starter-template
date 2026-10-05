import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DbRadioRegistry } from './db-radio.registry';

@Component({
  selector: 'db-radio',
  imports: [
    CommonModule,
  ],
  templateUrl: `./db-radio.component.html`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbRadioComponent),
      multi: true,
    },
  ],
})
export class DbRadioComponent implements ControlValueAccessor, OnInit, OnDestroy {

  @Input() id!: string;
  @Input() name!: string;
  @Input() value!: string;
  @Input() checked: boolean = false;
  @Input() label!: string;
  @Input() className: string = '';
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  private readonly registry = inject(DbRadioRegistry);
  private readonly cdr = inject(ChangeDetectorRef);

  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  ngOnInit(): void {
    if (this.name) {
      this.registry.register(this);
    }
  }

  ngOnDestroy(): void {
    this.registry.unregister(this);
  }

  writeValue(value: string): void {
    this.checked = value === this.value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  onChange() {
    if (!this.disabled) {
      this.checked = true;
      this.registry.select(this);
      this.onChangeFn(this.value);
      this.onTouchedFn();
      this.valueChange.emit(this.value);
    }
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  /** Usado por el registro para desmarcar este radio cuando otro del grupo se selecciona. */
  uncheck(): void {
    if (this.checked) {
      this.checked = false;
      this.cdr.markForCheck();
    }
  }
}
