import type { DataTableSummaryPosition, DataTableSummaryType } from './db-data-table.types';

export interface SelectableRowsConfig {
  columnName: string;
  values: Array<string | number | boolean>;
}

export interface DataTableNumberFormat {
  decimals?: number;
  thousandSeparator?: boolean;
  currency?: {
    symbol: string;
    position: 'start' | 'end';
  };
}

export interface DataTableColumnBase {
  columnaName: string;
  dataProperty: string;
  visible: boolean;
  sortable: boolean;
  alignment: string;
  /** Fusiona verticalmente celdas consecutivas con el mismo valor en esta columna (rowspan).
   * La data debe venir pre-ordenada por las columnas con mergeRows, en el orden en que
   * aparecen dentro de `columns` — ese orden define la jerarquía de agrupación (una columna
   * mergeRows solo fusiona si la columna mergeRows anterior en la jerarquía también fusionó
   * esa fila). Se calcula sobre la página visible. */
  mergeRows?: boolean;
  /** Peso de la columna en el reparto de ancho, en unidades `fr`. Por defecto 1: todas las
   * columnas visibles reparten el ancho a partes iguales. El componente lo envuelve siempre
   * en `minmax(0, Nfr)`, para que la columna pueda encoger por debajo de su contenido. */
  widthFr?: number;
}

export interface DataTableProgressCell {
  value: number;
  /** Porcentaje explicito (0-100). Si se omite, la barra se escala contra el mayor `value`
   * de la pagina visible, de modo que siempre haya una barra al 100%. */
  percent?: number;
}

export interface DataTableSummaryConfig {
  column?: string;
  summaryType?: DataTableSummaryType;
  position?: DataTableSummaryPosition;
  format?: string;
}

export interface DataTableStatusCell {
  code: string;
  description?: string;
  color?: string;
}

export interface DataTableRow {
  id?: string | number;
  orderId?: string | number;
  checked?: boolean;
  status?: DataTableStatusCell;
}

export interface DataTableSubAction {
  action: string;
  label: string;
  icon: string;
}

export interface DataTableAction {
  action: string;
  actionDescription: string;
  icon: string;
  enabledForStatuses?: string[];
  subActions?: DataTableSubAction[];
  /** Oculta por completo la acción (no solo deshabilitada) cuando el predicado devuelve false
   * para la fila. Opcional y retrocompatible: sin este campo la acción siempre es visible, igual
   * que antes de agregarlo. Usado, por ejemplo, para mostrar "Pago inscripción" solo en filas de
   * matrícula cuyo nivel es SEBAP. */
  visiblePredicate?: (item: unknown) => boolean;
}
