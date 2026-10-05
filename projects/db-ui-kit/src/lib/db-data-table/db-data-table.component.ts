import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DbLoaderComponent } from '../db-loader/db-loader.component';
import {
  DataTableAction,
  DataTableRow,
  DataTableStatusCell,
  DataTableProgressCell,
  SelectableRowsConfig,
  DataTableNumberFormat,
  DataTableSummaryConfig,
} from './db-data-table.interface';
import { DataTableColumn, DataTableDateFormat } from './db-data-table.types';

@Component({
  selector: 'db-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, DbLoaderComponent],
  templateUrl: './db-data-table.component.html',
  styleUrl: './db-data-table.component.css',
})
export class DbDataTableComponent<T extends DataTableRow = DataTableRow> implements OnInit, OnChanges {
  @Input() data: T[] = [];
  @Input() columns: DataTableColumn[] = [];
  @Input() actions: DataTableAction[] = [];
  /** Texto de la cabecera de la columna de acciones. Se puede pasar '' para dejarla sin
   * titulo (la celda conserva su borde y su alto igual): en una tabla con un solo icono
   * por fila, la palabra "Acciones" ocupa mas que la columna que encabeza. */
  @Input() actionsColumnName: string = 'Acciones';
  /** Ancho de la columna de acciones, como valor CSS. El defecto de 128px da aire a varias
   * acciones; con una sola conviene bajarlo (el minimo util es ~53px: 28px del boton mas el
   * px-3 de la celda), porque lo que sobra aqui se lo quita al reparto en `fr` del resto. */
  @Input() actionsColumnWidth: string = '128px';
  @Input() selectMultiple: boolean = false;
  @Input() selectableRows: SelectableRowsConfig | null = null;
  @Input() showToolbar: boolean = false;
  /** Boton "Descargar" de la barra de herramientas. La descarga en si la resuelve cada
   * consumidor, asi que se puede ocultar cuando la pantalla ya tiene su propio control. */
  @Input() showDownloadButton: boolean = true;
  /** Input "Buscar..." de la barra de herramientas. Filtra solo las filas que el componente
   * tiene en memoria, asi que conviene ocultarlo cuando el paginado es de servidor: buscaria
   * dentro de la pagina visible y no en el conjunto completo. */
  @Input() showSearch: boolean = true;
  @Input() zebraRows: boolean = false;
  @Input() reorderableColumns: boolean = false;
  @Input() totalRows: number = 0;
  @Input() totalPages: number = 0;
  @Input() rowsPerPage: number = 0;
  /** Opciones del combo "Mostrar N registros" de la barra de herramientas. Solo tiene
   * efecto con showToolbar activo. */
  @Input() rowsPerPageOptions: number[] = [10, 20, 50];
  @Input() summary: DataTableSummaryConfig[] = [];
  @Output() currentPageEmit = new EventEmitter<number>();
  /** Emite el nuevo tamano de pagina cuando el usuario lo cambia en el combo. La tabla ya
   * reseteo currentPage a 1 antes de emitir, asi que con paginado de servidor el consumidor
   * debe recargar la PRIMERA pagina con este tamano. */
  @Output() rowsPerPageEmit = new EventEmitter<number>();
  @Output() emitAction = new EventEmitter<{ action: string; rowData: T }>();

  public openMenuId: string | number | null = null;
  public openSubMenuKey: string | null = null;
  public menuPosition: { top?: string; bottom?: string; right?: string } = {};

  public search: string = '';
  public sortColumn: string = '';
  public sortDirection: 'asc' | 'desc' | '' = '';
  public currentPage: number = 1;
  // public perPage: number = 10;
  @Input() noDataMessage: string = 'No hay resultados';
  public loading: boolean = true;
  /** true mientras el consumidor trae datos nuevos (recarga, página de servidor, filtros):
   * muestra un loader solo sobre el área de datos y bloquea búsqueda y descarga. */
  @Input() isLoading: boolean = false;

  /** Buscar y Descargar no tienen sentido sin datos o mientras se cargan. */
  get toolbarDisabled(): boolean {
    return !this.data?.length || this.isLoading;
  }

  ngOnInit(): void {

    const firstSortable = this.columns.find((c) => c.sortable);
    if (firstSortable) {
      this.sortColumn = firstSortable.dataProperty;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      if (changes["data"]["currentValue"]) {
        this.loading = false;
      }

      // Si el dataset encoge (otro filtro, o filas que desaparecen en un refresco en vivo) la
      // pagina actual puede quedar fuera de rango: paginatedData devolveria vacio y se veria
      // el bloque @empty un instante antes de volver. Se reencuadra a la ultima pagina real.
      // El > 0 importa: con paginado de servidor, effectiveTotalPages es el @Input totalPages,
      // que vale 0 mientras el consumidor no lo mande — sin el guarda se perderia la pagina.
      const ultimaPagina = this.effectiveTotalPages;
      if (ultimaPagina > 0 && this.currentPage > ultimaPagina) {
        this.currentPage = ultimaPagina;
      }
    }
  }

  private getRawValue(item: T, dataProperty: string): unknown {
    return (item as unknown as Record<string, unknown>)[dataProperty];
  }

  get filteredData(): T[] {
    const s = this.search.toLowerCase();
    let filtered = [...this.data];

    if (s) {
      filtered = filtered.filter((item) => {
        return this.columns.some((col) => {
          if (!col.visible) return false;
          const value = this.getRawValue(item, col.dataProperty);
          return value ? String(value).toLowerCase().includes(s) : false;
        });
      });
    }

    if (this.sortColumn) {
      filtered.sort((a, b) => {
        const mod = this.sortDirection === 'asc' ? 1 : -1;
        const valA = this.getSortValue(a, this.sortColumn) as string | number;
        const valB = this.getSortValue(b, this.sortColumn) as string | number;

        if (valA < valB) return -1 * mod;
        if (valA > valB) return 1 * mod;
        return 0;
      });
    }

    return filtered;
  }

  private getSortValue(item: T, dataProperty: string): unknown {
    const value = this.getRawValue(item, dataProperty);
    if (value && typeof value === 'object') {
      const obj = value as { description?: unknown; code?: unknown };
      return obj.description ?? obj.code ?? '';
    }
    return value ?? '';
  }

  get summaryEndItems(): DataTableSummaryConfig[] {
    return this.summary.filter((s) => (s.position ?? 'end') === 'end' && this.isNumberColumn(s.column ?? ''));
  }

  get summaryOutOfTableItems(): DataTableSummaryConfig[] {
    return this.summary.filter((s) => (s.position ?? 'end') === 'out-of-table' && this.isNumberColumn(s.column ?? ''));
  }

  private isNumberColumn(dataProperty: string): boolean {
    return this.columns.find((c) => c.dataProperty === dataProperty)?.datatype === 'number';
  }

  public getSummaryTextForColumn(dataProperty: string): string {
    return this.summaryEndItems
      .filter((s) => (s.column ?? '') === dataProperty)
      .map((s) => this.getSummaryText(s))
      .join(' ');
  }

  public getSummaryText(config: DataTableSummaryConfig): string {
    const value = this.computeSummaryValue(config);
    const summaryType = config.summaryType ?? 'sum';
    const formattedValue =
      summaryType === 'count' ? String(value) : value.toFixed(this.getColumnDecimals(config.column ?? ''));

    const format = config.format ?? '';
    return format ? format.replace('{}', formattedValue) : formattedValue;
  }

  private getColumnDecimals(dataProperty: string): number {
    const col = this.columns.find((c) => c.dataProperty === dataProperty);
    return col?.datatype === 'number' ? col.format?.decimals ?? 0 : 0;
  }

  private computeSummaryValue(config: DataTableSummaryConfig): number {
    const column = config.column ?? '';
    const summaryType = config.summaryType ?? 'sum';

    if (summaryType === 'count') {
      return this.filteredData.filter((item) => {
        const value = this.getRawValue(item, column);
        return value !== null && value !== undefined && value !== '';
      }).length;
    }

    const values = this.filteredData
      .map((item) => Number(this.getRawValue(item, column)))
      .filter((value) => !Number.isNaN(value));

    if (values.length === 0) return 0;

    switch (summaryType) {
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'avg':
        return values.reduce((acc, value) => acc + value, 0) / values.length;
      case 'sum':
      default:
        return values.reduce((acc, value) => acc + value, 0);
    }
  }

  // Cuando el consumidor entrega el dataset completo (más filas que rowsPerPage),
  // la tabla pagina en el cliente. Cuando entrega solo la página actual (paginación
  // server-side, p. ej. gestion-reclamos), se respetan los totales que llegan por @Input.
  get isClientPaginated(): boolean {
    return this.rowsPerPage > 0 && this.filteredData.length > this.rowsPerPage;
  }

  // Con paginado de servidor el total lo manda el consumidor via totalRows. Si no lo manda
  // (caso tipico: toda la data cabe en una pagina, asi que isClientPaginated es false), se
  // cae a las filas que hay en memoria en vez de reportar 0 teniendo filas en pantalla.
  get effectiveTotalRows(): number {
    if (this.isClientPaginated) return this.filteredData.length;
    return this.totalRows || this.filteredData.length;
  }

  get effectiveTotalPages(): number {
    return this.isClientPaginated
      ? Math.max(1, Math.ceil(this.filteredData.length / this.rowsPerPage))
      : this.totalPages;
  }

  get paginatedData(): T[] {
    if (!this.isClientPaginated) return this.filteredData;

    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  // Las opciones del combo mas el rowsPerPage vigente si el consumidor paso uno que no esta
  // en la lista (p. ej. 25 contra [10, 20, 50]): sin esto el select no encontraria ninguna
  // option coincidente y se veria en blanco.
  get rowsPerPageSelectOptions(): number[] {
    const opciones = this.rowsPerPageOptions ?? [];
    if (this.rowsPerPage > 0 && !opciones.includes(this.rowsPerPage)) {
      return [...opciones, this.rowsPerPage].sort((a, b) => a - b);
    }
    return opciones;
  }

  get mergeableColumns(): DataTableColumn[] {
    return this.columns.filter((c) => c.visible && c.mergeRows);
  }

  get hasMergedColumns(): boolean {
    return this.mergeableColumns.length > 0;
  }

  // Fusión jerárquica de celdas (rowspan): una columna mergeRows solo fusiona una fila con
  // la anterior si su valor es igual Y la columna mergeRows anterior en la jerarquía (el
  // orden en `columns`) también fusionó esa fila — así "Operador" nunca fusiona a través de
  // un cambio de "Subproceso" aunque el operador coincida. Se calcula sobre paginatedData,
  // así cada página vuelve a mostrar el encabezado de grupo si este cruza el límite de página.
  get mergeInfo(): Map<string, Array<{ show: boolean; span: number }>> {
    const result = new Map<string, Array<{ show: boolean; span: number }>>();
    const rows = this.paginatedData;
    const mergeCols = this.mergeableColumns;

    const sameAsAboveByCol: boolean[][] = rows.map(() => []);

    mergeCols.forEach((col, colIndex) => {
      const info: Array<{ show: boolean; span: number }> = rows.map(() => ({ show: true, span: 1 }));
      let groupStart = 0;

      for (let i = 1; i < rows.length; i++) {
        const sameValue = this.getRawValue(rows[i], col.dataProperty) === this.getRawValue(rows[i - 1], col.dataProperty);
        const sameAsAbove = sameValue && (colIndex === 0 || sameAsAboveByCol[i][colIndex - 1]);
        sameAsAboveByCol[i][colIndex] = sameAsAbove;

        if (sameAsAbove) {
          info[i].show = false;
          info[groupStart].span++;
        } else {
          groupStart = i;
        }
      }

      result.set(col.dataProperty, info);
    });

    return result;
  }

  // Posición explícita de columna en el grid (1-based), para no depender del auto-placement
  // del navegador — con celdas fusionadas ocultando huecos de distinto tamaño en columnas
  // vecinas, el auto-placement puede desalinear celdas de columnas distintas entre sí.
  public columnGridIndex(col: DataTableColumn): number {
    let idx = this.selectMultiple ? 2 : 1;
    for (const c of this.columns) {
      if (!c.visible) continue;
      if (c === col) return idx;
      idx++;
    }
    return idx;
  }

  public actionsGridIndex(): number {
    let idx = this.selectMultiple ? 2 : 1;
    idx += this.columns.filter((c) => c.visible).length;
    return idx;
  }

  public showCell(col: DataTableColumn, rowIndex: number): boolean {
    if (!col.mergeRows) return true;
    return this.mergeInfo.get(col.dataProperty)?.[rowIndex]?.show ?? true;
  }

  public cellSpan(col: DataTableColumn, rowIndex: number): number {
    if (!col.mergeRows) return 1;
    return this.mergeInfo.get(col.dataProperty)?.[rowIndex]?.span ?? 1;
  }

  public getProgressCell(item: T, col: DataTableColumn): DataTableProgressCell | null {
    const value = this.getRawValue(item, col.dataProperty);
    return value && typeof value === 'object' ? (value as DataTableProgressCell) : null;
  }

  public clampPercent(percent: number): number {
    return Math.min(100, Math.max(0, percent));
  }

  /** Ancho de la barra en %. Si la celda trae `percent` manda el consumidor; si no, la barra
   * se escala contra el mayor valor de la pagina visible, de modo que la mayor llega al 100%
   * y el resto queda en proporcion a ella. */
  public progressWidth(item: T, col: DataTableColumn): number {
    const cell = this.getProgressCell(item, col);
    if (!cell) return 0;
    if (cell.percent !== undefined) return this.clampPercent(cell.percent);

    const max = this.paginatedData.reduce((mayor, fila) => {
      const otra = this.getProgressCell(fila, col);
      return otra ? Math.max(mayor, otra.value) : mayor;
    }, 0);

    return max <= 0 ? 0 : this.clampPercent((cell.value / max) * 100);
  }

  get totalEntries(): number {
    return this.filteredData.length;
  }

  get startEntry(): number {
    return this.totalEntries === 0 ? 0 : (this.currentPage - 1) * this.rowsPerPage + 1;
  }
  get endEntry(): number {
    if (this.totalEntries === 0) return 0;
    // Sin rowsPerPage informado no hay paginacion: la pagina es toda la data, asi que el
    // tramo termina en el total. Multiplicar por 0 daria "al 0" con filas en pantalla.
    const porPagina = this.rowsPerPage > 0 ? this.rowsPerPage : this.effectiveTotalRows;
    return Math.min(this.currentPage * porPagina, this.effectiveTotalRows);
  }

  get pagesAroundCurrent(): number[] {
    const totalPages = this.effectiveTotalPages;
    const pages: number[] = [];
    if (totalPages <= 5) {
      for (let i = 2; i < totalPages; i++) pages.push(i);
      return pages;
    }
    if (this.currentPage <= 3) return [2, 3, 4];
    if (this.currentPage >= totalPages - 2)
      return [totalPages - 3, totalPages - 2, totalPages - 1];
    return [this.currentPage - 1, this.currentPage, this.currentPage + 1];
  }

  public onColumnDrop(event: CdkDragDrop<DataTableColumn[]>): void {
    if (!this.reorderableColumns) return;

    const visibleColumns = this.columns.filter((c) => c.visible);
    const hiddenColumns = this.columns.filter((c) => !c.visible);
    moveItemInArray(visibleColumns, event.previousIndex, event.currentIndex);
    this.columns = [...visibleColumns, ...hiddenColumns];
  }

  public sortBy(col: DataTableColumn): void {
    if (!col.sortable) return;

    if (this.sortColumn === col.dataProperty) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col.dataProperty;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  }

  public goToPage(page: number): void {
    if (page >= 1 && page <= this.effectiveTotalPages) this.currentPage = page;
    this.currentPageEmit.emit(this.currentPage);
  }

  public nextPage(): void {
    if (this.currentPage < this.effectiveTotalPages) this.currentPage++;
    this.currentPageEmit.emit(this.currentPage);
  }

  public prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
    this.currentPageEmit.emit(this.currentPage);
  }

  public onPerPageChange(value: number | string): void {
    const nuevo = +value;
    if (!Number.isFinite(nuevo) || nuevo <= 0 || nuevo === this.rowsPerPage) return;

    this.rowsPerPage = nuevo;
    // Cambiar el tamano de pagina invalida la pagina actual: la pagina 7 de un listado de
    // 10 en 10 puede no existir con 50 por pagina. Se vuelve a la primera.
    this.currentPage = 1;
    // Se emite solo rowsPerPageEmit y no currentPageEmit: con paginado de servidor dos
    // eventos dispararian dos handlers en el consumidor, y por tanto dos peticiones. El
    // reset a la pagina 1 forma parte del contrato documentado en rowsPerPageEmit.
    this.rowsPerPageEmit.emit(nuevo);
  }

  public onPerPageSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.onPerPageChange(select.value);
  }

  public getStatusClass(color: string): string {
    const colors: { [key: string]: string } = {
      red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
      green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',

      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    };

    return colors[color] || colors['gray'];
  }

  public executeAction(action: string, item: T): void {
    this.emitAction.emit({ action, rowData: item });
  }

  public downloadData() {}

  /** Estado visual del checkbox de una fila: marcado, no seleccionable o libre. */
  public rowCheckboxClasses(item: T): string {
    if (item.checked) {
      return 'border-brand-500 bg-brand-500';
    }

    return this.isItemSelectable(item)
      ? 'border-gray-400 dark:border-gray-600'
      : 'border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800';
  }

  public isItemSelectable(item: T): boolean {
    if (!this.selectableRows || !this.selectableRows.values.length) return true;

    const rawValue = this.getRawValue(item, this.selectableRows.columnName);
    const value = (
      rawValue && typeof rawValue === 'object' ? (rawValue as { code: unknown }).code : rawValue
    ) as string | number | boolean;
    return this.selectableRows.values.includes(value);
  }

  public toggleAll(isSelected: boolean): void {
    this.paginatedData.forEach((item) => {
      if (this.isItemSelectable(item)) item.checked = isSelected;
    });
  }

  public onToggleAllChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.toggleAll(checkbox.checked);
  }

  public isAllSelected(): boolean {
    const selectable = this.paginatedData.filter((item) => this.isItemSelectable(item));
    if (selectable.length === 0) return false;
    return selectable.every((item) => item.checked);
  }

  @HostListener('document:click', ['$event'])
  public closeMenu(event: Event): void {
    this.openMenuId = null;
    this.openSubMenuKey = null;
  }

  public toggleSubMenu(event: Event, item: T, action: string): void {
    event.stopPropagation();
    const key = `${item.id || item.orderId}_${action}`;
    this.openSubMenuKey = this.openSubMenuKey === key ? null : key;
  }

  public toggleMenu(event: Event, item: T): void {
    event.stopPropagation();
    const id = item.id || item.orderId || null;

    if (this.openMenuId === id) {
      this.openMenuId = null;
      return;
    }

    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < 200) {
      this.menuPosition = {
        bottom: `${window.innerHeight - rect.top}px`,
        right: `${window.innerWidth - rect.right}px`,
      };
    } else {
      this.menuPosition = {
        top: `${rect.bottom + 4}px`,
        right: `${window.innerWidth - rect.right}px`,
      };
    }

    this.openMenuId = id;
  }

  public isLastRows(item: T): boolean {
    const index = this.paginatedData.indexOf(item);
    return index >= this.paginatedData.length - 2 && this.paginatedData.length > 3;
  }

  public getCellObject(item: T, col: DataTableColumn): DataTableStatusCell | null {
    const value = this.getRawValue(item, col.dataProperty);
    return value && typeof value === 'object' ? (value as DataTableStatusCell) : null;
  }

  public getFormattedValue(item: T, col: DataTableColumn): unknown {
    const rawValue = this.getRawValue(item, col.dataProperty);

    if (col.datatype === 'number') {
      return this.formatNumber(rawValue, col.format);
    }

    if (col.datatype === 'datetime') {
      return this.formatDatetime(rawValue, col.format);
    }

    return rawValue;
  }

  private static readonly WEEKDAY_NAMES_ES = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
  ];

  private static readonly MONTH_NAMES_ES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  private parseDateValue(rawValue: unknown): Date | null {
    if (rawValue instanceof Date) {
      return Number.isNaN(rawValue.getTime()) ? null : rawValue;
    }

    if (typeof rawValue === 'string') {
      const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
      if (isoMatch) {
        const [, year, month, day, hours = '0', minutes = '0', seconds = '0'] = isoMatch;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
      }
    }

    const parsed = new Date(rawValue as string | number | Date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDatetime(rawValue: unknown, format?: DataTableDateFormat): unknown {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return rawValue ?? '';
    }

    const date = this.parseDateValue(rawValue);
    if (!date) {
      return rawValue;
    }

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const HH = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    switch (format) {
      case 'dd-mm-YYYY':
        return `${dd}-${mm}-${yyyy}`;
      case 'dd/mm/YYYY HH:mm:ss':
        return `${dd}/${mm}/${yyyy} ${HH}:${min}:${ss}`;
      case 'dd/mm/YYYY HH:mm':
        return `${dd}/${mm}/${yyyy} ${HH}:${min}`;
      case "dddd dd 'de' MMMM 'de' YYYY": {
        const weekdayName = DbDataTableComponent.WEEKDAY_NAMES_ES[date.getDay()];
        const monthName = DbDataTableComponent.MONTH_NAMES_ES[date.getMonth()];
        return `${weekdayName} ${dd} de ${monthName} de ${yyyy}`;
      }
      case 'dd/mm/YYYY':
      default:
        return `${dd}/${mm}/${yyyy}`;
    }
  }

  private formatNumber(rawValue: unknown, format?: DataTableNumberFormat): string {
    const numericValue = Number(rawValue);
    if (rawValue === null || rawValue === undefined || Number.isNaN(numericValue)) {
      return rawValue == null ? '' : String(rawValue);
    }

    const decimals = format?.decimals ?? 0;
    let formatted = numericValue.toFixed(decimals);

    if (format?.thousandSeparator) {
      const [integerPart, decimalPart] = formatted.split('.');
      const integerWithSeparator = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = decimalPart ? `${integerWithSeparator}.${decimalPart}` : integerWithSeparator;
    }

    if (format?.currency) {
      formatted = format.currency.position === 'end'
        ? `${formatted} ${format.currency.symbol}`
        : `${format.currency.symbol} ${formatted}`;
    }

    return formatted;
  }

  // Cada fila (header, body, summary) es su propio contenedor — no una sola <table>. Con
  // flexbox esto rompía la alineación de bordes entre filas, porque `min-width: auto` deja
  // que el contenido de una celda empuje su ancho más allá del reparto equitativo, sin que
  // las demás filas se enteren. CSS Grid con el mismo `grid-template-columns` explícito en
  // cada fila fuerza el mismo reparto (columnas `minmax(0, 1fr)`) sin importar el contenido,
  // así los bordes coinciden entre header, filas y summary.
  get gridTemplateColumns(): string {
    const parts: string[] = [];

    if (this.selectMultiple) parts.push('40px');
    // minmax(0, Nfr) y no Nfr a secas: sin el minimo en 0 la columna no puede encoger por
    // debajo de su contenido y un texto largo desborda el reparto.
    parts.push(
      ...this.columns.filter((c) => c.visible).map((c) => `minmax(0, ${c.widthFr ?? 1}fr)`),
    );
    if (this.actions && this.actions.length > 0) parts.push(this.actionsColumnWidth);

    return parts.join(' ');
  }

  public getAlignmentClass(alignment: string): string {
    const alignMap: { [key: string]: string } = {
      left: 'justify-start text-left',
      center: 'justify-center text-center',
      right: 'justify-end text-right',
    };
    return alignMap[alignment] || 'justify-start text-left';
  }

  public isActionVisible(act: DataTableAction, item: T): boolean {
    return !act.visiblePredicate || act.visiblePredicate(item);
  }

  public isActionEnabled(act: DataTableAction, item: T): boolean {
    if (!act.enabledForStatuses || act.enabledForStatuses.length === 0) {
      return true;
    }
    const code = item?.status?.code;
    return !!code && act.enabledForStatuses.includes(code);
  }

  public handleAction(act: DataTableAction, item: T): void {
    if (!this.isActionEnabled(act, item)) return;
    this.executeAction(act.action, item);
    this.openMenuId = null;
  }
}
