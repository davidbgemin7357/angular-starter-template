import { DbDatePickerValue } from './db-date-picker.types';

export interface DbDatePickerRangeValue {
  startDate: string | Date;
  endDate: string | Date;
}

export type DbDatePickerInternalValue = DbDatePickerValue | string[] | null | undefined;

export interface DbDatePickerOnChangeFn {
  (value: DbDatePickerInternalValue): void;
}

export interface DbDatePickerOnTouchedFn {
  (): void;
}
