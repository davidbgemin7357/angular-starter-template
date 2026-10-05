import type { DataTableColumnBase, DataTableNumberFormat } from './db-data-table.interface';

export type DataTableColumnDataType = 'boolean' | 'string' | 'number' | 'datetime' | 'progress';

export type DataTableDateFormat =
  | 'dd-mm-YYYY'
  | 'dd/mm/YYYY'
  | 'dd/mm/YYYY HH:mm:ss'
  | 'dd/mm/YYYY HH:mm'
  | "dddd dd 'de' MMMM 'de' YYYY";

export type DataTableColumn =
  | (DataTableColumnBase & { datatype?: 'string' | 'boolean'; format?: never })
  | (DataTableColumnBase & { datatype: 'number'; format?: DataTableNumberFormat })
  | (DataTableColumnBase & { datatype: 'datetime'; format?: DataTableDateFormat })
  | (DataTableColumnBase & { datatype: 'progress'; format?: never });

export type DataTableSummaryType = 'count' | 'max' | 'min' | 'avg' | 'sum';

export type DataTableSummaryPosition = 'end' | 'out-of-table';
