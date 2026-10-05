import { DbDatePickerRangeValue } from './db-date-picker.interface';

export type DbDatePickerMode = 'single' | 'multiple' | 'range' | 'time' | 'datetime';

/** Formato de fecha para los modos single/range/multiple: 'ymd' = año-mes-día (default,
 * Y-m-d), 'dmy' = día-mes-año (d-m-Y). No afecta a los modos time/datetime. */
export type DbDatePickerDateFormat = 'ymd' | 'dmy';

export type DbDatePickerValue = string | Date | Array<string | Date> | DbDatePickerRangeValue;
