import { Component, OnDestroy, computed, signal } from '@angular/core';
import {
  DataTableAction,
  DataTableColumn,
  DataTableProgressCell,
  DataTableRow,
  DataTableStatusCell,
  DataTableSummaryConfig,
  DbButtonComponent,
  DbComponentCardComponent,
  DbDataTableComponent,
  SelectableRowsConfig,
} from 'db-ui-kit-angular';

interface PedidoRow extends DataTableRow {
  id: number;
  cliente: string;
  cantidad: number;
  monto: number;
  fecha: string;
  pagado: boolean;
  avance: DataTableProgressCell;
  status: DataTableStatusCell;
}

interface TareaRow extends DataTableRow {
  id: number;
  area: string;
  subproceso: string;
  operador: string;
  horas: number;
}

const ESTADOS: DataTableStatusCell[] = [
  { code: 'A', description: 'Aprobado', color: 'green' },
  { code: 'P', description: 'Pendiente', color: 'yellow' },
  { code: 'R', description: 'Rechazado', color: 'red' },
  { code: 'E', description: 'En revisión', color: 'blue' },
  { code: 'X', description: 'Anulado', color: 'gray' },
];

const CLIENTES = [
  'Juan Pérez', 'María Gómez', 'Carlos Ramírez', 'Ana Torres', 'Luis Fernández', 'Rosa Quispe',
  'Pedro Salas', 'Lucía Vargas', 'Jorge Castillo', 'Elena Rojas', 'Miguel Chávez', 'Sofía Herrera',
];

const TOTAL_PEDIDOS = 23;

/** seed distinto de 0 cambia cantidades y montos, para simular datos "nuevos" al recargar. */
function crearPedidos(seed = 0): PedidoRow[] {
  return Array.from({ length: TOTAL_PEDIDOS }, (_, i) => ({
    id: i + 1,
    cliente: CLIENTES[(i + seed) % CLIENTES.length],
    cantidad: 250 + (((i + seed) * 7919) % 48000),
    monto: 120.5 + (((i + seed) * 3571) % 9800) + (i % 4) * 0.255,
    fecha: `2026-${String((i % 9) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}T${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`,
    pagado: i % 3 !== 0,
    avance: i % 5 === 0 ? { value: (i * 11) % 100, percent: (i * 11) % 100 } : { value: (i * 17) % 90 },
    status: { ...ESTADOS[i % ESTADOS.length] },
  }));
}

/** Vitrina de db-data-table: tipos de columna, estados, acciones con subacciones, resumen,
 * barra de herramientas, paginado (resuelto aqui cortando la data local, igual que haria un
 * paginado de servidor), seleccion multiple, filas cebra, columnas reordenables, fusion de
 * celdas y tabla vacia. */
@Component({
  selector: 'app-data-table-demo',
  imports: [DbDataTableComponent, DbComponentCardComponent, DbButtonComponent],
  templateUrl: './data-table-demo.component.html',
  styles: ``,
})
export class DataTableDemoComponent implements OnDestroy {
  // ===================== Carga simulada (isLoading) =====================
  public lastLoadingEvent = signal('ninguno');
  public loadingData = signal(false);
  public loadingRowsPerPage = signal(5);
  public loadingTotalPages = computed(() => Math.ceil(this.totalRows / this.loadingRowsPerPage()));
  /** Filas que "devolvió el servidor" para la página pedida. */
  public loadingPageData = signal<PedidoRow[]>([]);
  private loadingSource: PedidoRow[] = crearPedidos();
  private loadingPage = 1;
  private reloadCount = 0;
  private loadingTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.fetchPage(1, 800, 'carga inicial');
  }

  ngOnDestroy(): void {
    clearTimeout(this.loadingTimer);
  }

  public handleLoadingPage(page: number): void {
    this.fetchPage(page, 800, `currentPageEmit → página ${page}`);
  }

  public handleLoadingRowsPerPage(rows: number): void {
    this.loadingRowsPerPage.set(rows);
    this.fetchPage(1, 800, `rowsPerPageEmit → ${rows} por página`);
  }

  public reloadData(): void {
    this.loadingSource = crearPedidos(++this.reloadCount * 5);
    this.fetchPage(this.loadingPage, 1500, `recarga #${this.reloadCount}`);
  }

  public clearAndLoad(): void {
    this.loadingPageData.set([]);
    this.loadingSource = crearPedidos(++this.reloadCount * 5);
    this.fetchPage(1, 1500, 'tabla vaciada y recargada');
  }

  /** Simula una llamada al servidor: loader encendido durante `delay` ms y luego llega la página. */
  private fetchPage(page: number, delay: number, reason: string): void {
    clearTimeout(this.loadingTimer);
    this.loadingPage = page;
    this.loadingData.set(true);
    this.lastLoadingEvent.set(`${reason} (cargando…)`);

    this.loadingTimer = setTimeout(() => {
      const start = (page - 1) * this.loadingRowsPerPage();
      this.loadingPageData.set(this.loadingSource.slice(start, start + this.loadingRowsPerPage()));
      this.loadingData.set(false);
      this.lastLoadingEvent.set(`${reason} (listo)`);
    }, delay);
  }

  public lastEvent = signal('ninguno');
  public lastSelectionEvent = signal('ninguno');
  public lastSimpleEvent = signal('ninguno');

  // ===================== (1) Tabla completa con paginado =====================
  private readonly allPedidos: PedidoRow[] = crearPedidos();
  public currentPage = signal(1);
  public rowsPerPage = signal(5);
  public readonly rowsPerPageOptions: number[] = [5, 10, 20];
  public readonly totalRows: number = this.allPedidos.length;
  public totalPages = computed(() => Math.ceil(this.totalRows / this.rowsPerPage()));
  public pageData = computed(() => {
    const start = (this.currentPage() - 1) * this.rowsPerPage();
    return this.allPedidos.slice(start, start + this.rowsPerPage());
  });

  public readonly pedidoColumns: DataTableColumn[] = [
    { columnaName: 'N°', dataProperty: 'id', visible: true, sortable: true, alignment: 'center', datatype: 'number', widthFr: 0.5 },
    { columnaName: 'Cliente', dataProperty: 'cliente', visible: true, sortable: true, alignment: 'left', datatype: 'string', widthFr: 1.5 },
    {
      columnaName: 'Cantidad',
      dataProperty: 'cantidad',
      visible: true,
      sortable: true,
      alignment: 'right',
      datatype: 'number',
      format: { thousandSeparator: true },
    },
    {
      columnaName: 'Monto',
      dataProperty: 'monto',
      visible: true,
      sortable: true,
      alignment: 'right',
      datatype: 'number',
      format: { decimals: 2, thousandSeparator: true, currency: { symbol: 'S/', position: 'start' } },
    },
    {
      columnaName: 'Fecha',
      dataProperty: 'fecha',
      visible: true,
      sortable: true,
      alignment: 'center',
      datatype: 'datetime',
      format: 'dd/mm/YYYY HH:mm',
    },
    { columnaName: 'Pagado', dataProperty: 'pagado', visible: true, sortable: false, alignment: 'center', datatype: 'boolean', widthFr: 0.7 },
    { columnaName: 'Avance', dataProperty: 'avance', visible: true, sortable: false, alignment: 'left', datatype: 'progress', widthFr: 1.3 },
    { columnaName: 'Estado', dataProperty: 'status', visible: true, sortable: true, alignment: 'center', datatype: 'string' },
  ];

  public readonly pedidoActions: DataTableAction[] = [
    { action: 'VER', actionDescription: 'Ver detalle', icon: 'visibility' },
    { action: 'EDITAR', actionDescription: 'Editar (solo Pendiente o En revisión)', icon: 'edit', enabledForStatuses: ['P', 'E'] },
    {
      action: 'EXPORTAR',
      actionDescription: 'Exportar',
      icon: 'download',
      subActions: [
        { action: 'EXPORTAR_PDF', label: 'PDF', icon: 'picture_as_pdf' },
        { action: 'EXPORTAR_EXCEL', label: 'Excel', icon: 'table_view' },
      ],
    },
  ];

  public readonly pedidoSummary: DataTableSummaryConfig[] = [
    { column: 'cantidad', summaryType: 'avg', format: 'Prom: {}' },
    { column: 'monto', summaryType: 'sum', format: 'Total: S/ {}' },
    { column: 'id', summaryType: 'count', position: 'out-of-table', format: 'Filas en la página: {}' },
  ];

  public handlePedidoAction(event: { action: string; rowData: DataTableRow }): void {
    const row = event.rowData as PedidoRow;
    this.lastEvent.set(`emitAction → ${event.action} sobre el pedido #${row.id} (${row.cliente})`);
  }

  public handlePage(page: number): void {
    this.currentPage.set(page);
    this.lastEvent.set(`currentPageEmit → página ${page}`);
  }

  public handleRowsPerPage(rows: number): void {
    this.rowsPerPage.set(rows);
    this.currentPage.set(1);
    this.lastEvent.set(`rowsPerPageEmit → ${rows} registros por página`);
  }

  // ===================== (2) Seleccion multiple =====================
  public readonly seleccionData: PedidoRow[] = crearPedidos().slice(0, 8);

  public readonly seleccionColumns: DataTableColumn[] = [
    { columnaName: 'N°', dataProperty: 'id', visible: true, sortable: true, alignment: 'center', datatype: 'number', widthFr: 0.5 },
    { columnaName: 'Cliente', dataProperty: 'cliente', visible: true, sortable: true, alignment: 'left', datatype: 'string' },
    {
      columnaName: 'Monto',
      dataProperty: 'monto',
      visible: true,
      sortable: true,
      alignment: 'right',
      datatype: 'number',
      format: { decimals: 2, currency: { symbol: 'USD', position: 'end' } },
    },
    { columnaName: 'Estado', dataProperty: 'status', visible: true, sortable: false, alignment: 'center', datatype: 'string' },
  ];

  public readonly selectableRows: SelectableRowsConfig = { columnName: 'status', values: ['A', 'P'] };

  public showSelection(): void {
    const seleccionados = this.seleccionData.filter((row) => row.checked).map((row) => `#${row.id}`);
    this.lastSelectionEvent.set(
      seleccionados.length ? `Seleccionados: ${seleccionados.join(', ')}` : 'No hay filas seleccionadas',
    );
  }

  public clearSelection(): void {
    this.seleccionData.forEach((row) => (row.checked = false));
    this.lastSelectionEvent.set('Selección limpiada');
  }

  // ===================== (3) Cebra, reordenables y fusion =====================
  public readonly cebraData: PedidoRow[] = crearPedidos().slice(0, 7);

  public readonly cebraColumns: DataTableColumn[] = [
    { columnaName: 'N°', dataProperty: 'id', visible: true, sortable: true, alignment: 'center', datatype: 'number', widthFr: 0.5 },
    { columnaName: 'Cliente', dataProperty: 'cliente', visible: true, sortable: true, alignment: 'left', datatype: 'string' },
    { columnaName: 'Fecha', dataProperty: 'fecha', visible: true, sortable: true, alignment: 'left', datatype: 'datetime', format: "dddd dd 'de' MMMM 'de' YYYY", widthFr: 2 },
    { columnaName: 'Pagado', dataProperty: 'pagado', visible: true, sortable: false, alignment: 'center', datatype: 'boolean' },
    { columnaName: 'Estado', dataProperty: 'status', visible: true, sortable: true, alignment: 'center', datatype: 'string' },
  ];

  // Pre-ordenada por area y subproceso: mergeRows fusiona celdas consecutivas y la jerarquia
  // sigue el orden de las columnas.
  public readonly tareaData: TareaRow[] = [
    { id: 1, area: 'Logística', subproceso: 'Recepción', operador: 'Juan Pérez', horas: 6 },
    { id: 2, area: 'Logística', subproceso: 'Recepción', operador: 'María Gómez', horas: 4 },
    { id: 3, area: 'Logística', subproceso: 'Despacho', operador: 'María Gómez', horas: 8 },
    { id: 4, area: 'Logística', subproceso: 'Despacho', operador: 'Carlos Ramírez', horas: 5 },
    { id: 5, area: 'Producción', subproceso: 'Ensamblaje', operador: 'Ana Torres', horas: 7 },
    { id: 6, area: 'Producción', subproceso: 'Ensamblaje', operador: 'Luis Fernández', horas: 3 },
    { id: 7, area: 'Producción', subproceso: 'Control de calidad', operador: 'Rosa Quispe', horas: 6 },
  ];

  public readonly tareaColumns: DataTableColumn[] = [
    { columnaName: 'Área', dataProperty: 'area', visible: true, sortable: false, alignment: 'left', datatype: 'string', mergeRows: true },
    { columnaName: 'Subproceso', dataProperty: 'subproceso', visible: true, sortable: false, alignment: 'left', datatype: 'string', mergeRows: true },
    { columnaName: 'Operador', dataProperty: 'operador', visible: true, sortable: false, alignment: 'left', datatype: 'string' },
    { columnaName: 'Horas', dataProperty: 'horas', visible: true, sortable: false, alignment: 'right', datatype: 'number', format: { decimals: 1 } },
  ];

  public readonly tareaSummary: DataTableSummaryConfig[] = [
    { column: 'horas', summaryType: 'sum', format: '{} h' },
  ];

  public handleSimpleAction(event: { action: string; rowData: DataTableRow }): void {
    this.lastSimpleEvent.set(`emitAction → ${event.action} sobre la fila #${event.rowData.id}`);
  }

  public readonly simpleActions: DataTableAction[] = [
    { action: 'VER', actionDescription: 'Ver', icon: 'visibility' },
  ];

  // ===================== (4) Tabla vacia =====================
  public readonly emptyData: PedidoRow[] = [];
}
