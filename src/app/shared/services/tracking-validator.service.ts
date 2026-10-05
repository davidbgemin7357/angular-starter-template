import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class TrackingValidatorService {
  static minTrackingLength(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value ?? '';
      return value.length >= min
        ? null
        : { minTrackingLength: { required: min, actual: value.length } };
    };
  }
}
