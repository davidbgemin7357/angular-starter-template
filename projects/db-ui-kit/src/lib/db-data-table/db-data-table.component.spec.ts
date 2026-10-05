import { TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DbDataTableComponent } from './db-data-table.component';
import { DataTableAction, DataTableRow, SelectableRowsConfig } from './db-data-table.interface';
import { DataTableColumn } from './db-data-table.types';

interface TestRow extends DataTableRow {
  name: string;
  amount?: number;
  createdAt?: string;
  hiddenField?: string;
}

describe('DbDataTableComponent', () => {
  let columns: DataTableColumn[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbDataTableComponent],
    }).compileComponents();

    columns = [
      { columnaName: 'Nombre', dataProperty: 'name', visible: true, sortable: true, alignment: 'left' },
      {
        columnaName: 'Monto',
        dataProperty: 'amount',
        visible: true,
        sortable: true,
        alignment: 'right',
        datatype: 'number',
        format: { decimals: 2, thousandSeparator: true, currency: { symbol: '$', position: 'start' } },
      },
      {
        columnaName: 'Fecha',
        dataProperty: 'createdAt',
        visible: true,
        sortable: false,
        alignment: 'left',
        datatype: 'datetime',
        format: 'dd/mm/YYYY',
      },
      { columnaName: 'Estado', dataProperty: 'status', visible: true, sortable: true, alignment: 'left' },
      { columnaName: 'Oculta', dataProperty: 'hiddenField', visible: false, sortable: false, alignment: 'left' },
    ];
  });

  function createFixture() {
    return TestBed.createComponent(DbDataTableComponent<TestRow>);
  }

  function createRows(): TestRow[] {
    return [
      {
        id: 1,
        name: 'Ana',
        amount: 1500.5,
        createdAt: '2026-01-15',
        status: { code: 'A', description: 'Activo', color: 'green' },
      },
      {
        id: 2,
        name: 'Beto',
        amount: 200,
        createdAt: '2026-02-20',
        status: { code: 'P', description: 'Pendiente', color: 'yellow' },
      },
      {
        id: 3,
        name: 'Carla',
        amount: 3000,
        createdAt: '2026-03-25',
        status: { code: 'R', description: 'Rechazado', color: 'red' },
      },
    ];
  }

  it('debe crearse correctamente con el estado inicial de carga y paginación', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.loading).toBe(true);
    expect(component.currentPage).toBe(1);
    expect(component.sortDirection).toBe('');
  });

  it('debe poner loading en false cuando llegan datos vía ngOnChanges', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('data', createRows());
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBe(false);
  });

  it('ngOnInit debe fijar sortColumn a la primera columna ordenable', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();

    expect(fixture.componentInstance.sortColumn).toBe('name');
  });

  it('debe filtrar filas por texto de búsqueda sobre columnas visibles', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', createRows());
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.search = 'beto';

    expect(component.filteredData.length).toBe(1);
    expect(component.filteredData[0].name).toBe('Beto');
  });

  it('debe ignorar columnas no visibles al filtrar por texto de búsqueda', () => {
    const rows = createRows();
    rows[0].hiddenField = 'clave-secreta';

    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.search = 'clave-secreta';

    expect(component.filteredData.length).toBe(0);
  });

  it('sortBy debe alternar entre orden ascendente y descendente para una columna string', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', createRows());
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const nameColumn = columns[0];

    component.sortBy(nameColumn);
    expect(component.sortDirection).toBe('asc');
    expect(component.filteredData.map((r) => r.name)).toEqual(['Ana', 'Beto', 'Carla']);

    component.sortBy(nameColumn);
    expect(component.sortDirection).toBe('desc');
    expect(component.filteredData.map((r) => r.name)).toEqual(['Carla', 'Beto', 'Ana']);
  });

  it('todos sus botones son type="button" (dentro de un <form> no deben enviarlo)', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', createRows());
    fixture.componentRef.setInput('showToolbar', true);
    fixture.componentRef.setInput('rowsPerPage', 1);
    fixture.componentRef.setInput('actions', [{ action: 'VER', actionDescription: 'Ver', icon: 'visibility' }]);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((b) => b.type === 'button')).toBe(true);
  });

  it('sortBy debe ignorar columnas no ordenables', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', createRows());
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.sortBy(columns[2]); // Fecha: sortable false

    expect(component.sortColumn).toBe('name');
    expect(component.sortDirection).toBe('');
  });

  it('Descargar y Buscar deben estar deshabilitados cuando no hay datos', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('showToolbar', true);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    await fixture.whenStable();

    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((b) => b.textContent?.includes('Descargar'))!;
    const searchInput = fixture.nativeElement.querySelector('input[placeholder="Buscar..."]') as HTMLInputElement;
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('cursor-not-allowed')).toBe(true);
    expect(searchInput.disabled).toBe(true);
    expect(searchInput.classList.contains('cursor-not-allowed')).toBe(true);

    fixture.componentRef.setInput('data', createRows());
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button.disabled).toBe(false);
    expect(searchInput.disabled).toBe(false);
  });

  it('con isLoading muestra el loader dentro del área de datos y oculta el mensaje sin datos', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('showToolbar', true);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const area = fixture.nativeElement.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(area).not.toBeNull();
    expect(area.querySelector('db-loader .box.box-contained')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('No hay resultados');

    // Con datos previos, la búsqueda sigue deshabilitada mientras carga.
    fixture.componentRef.setInput('data', createRows());
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('input[placeholder="Buscar..."]') as HTMLInputElement).disabled).toBe(true);

    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeNull();
    expect((fixture.nativeElement.querySelector('input[placeholder="Buscar..."]') as HTMLInputElement).disabled).toBe(false);
  });

  it('sortBy debe usar description del objeto status (getSortValue) al ordenar la columna status', () => {
    const rows: TestRow[] = [
      { id: 1, name: 'Ana', status: { code: 'R', description: 'Rechazado' } },
      { id: 2, name: 'Beto', status: { code: 'A', description: 'Activo' } },
      { id: 3, name: 'Carla', status: { code: 'P', description: 'Pendiente' } },
    ];

    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const statusColumn = columns[3];

    component.sortBy(statusColumn);

    expect(component.sortDirection).toBe('asc');
    expect(component.filteredData.map((r) => r.name)).toEqual(['Beto', 'Carla', 'Ana']);
  });

  it('debe paginar en el cliente cuando rowsPerPage es menor que el total de filas', () => {
    const rows: TestRow[] = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Fila ${i + 1}`,
    }));

    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('rowsPerPage', 2);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    // ngOnInit selecciona 'name' (primera columna sortable) como sortColumn por defecto;
    // se limpia aquí porque este caso prueba paginación, no ordenamiento.
    component.sortColumn = '';

    expect(component.isClientPaginated).toBe(true);
    expect(component.effectiveTotalPages).toBe(3);
    expect(component.paginatedData.length).toBe(2);
    expect(component.paginatedData.map((r) => r.name)).toEqual(['Fila 1', 'Fila 2']);

    component.goToPage(2);
    expect(component.currentPage).toBe(2);
    expect(component.paginatedData.map((r) => r.name)).toEqual(['Fila 3', 'Fila 4']);

    component.goToPage(99);
    expect(component.currentPage).toBe(2);
  });

  describe('widthFr', () => {
    it('gridTemplateColumns debe repartir el ancho segun widthFr, con 1fr por defecto', () => {
      const anchos: DataTableColumn[] = [
        { columnaName: 'Nombre', dataProperty: 'name', visible: true, sortable: false, alignment: 'left', widthFr: 0.9 },
        // Sin widthFr: debe caer al peso por defecto.
        { columnaName: 'Monto', dataProperty: 'amount', visible: true, sortable: false, alignment: 'right' },
        { columnaName: 'Avance', dataProperty: 'avance', visible: true, sortable: false, alignment: 'left', widthFr: 2 },
        { columnaName: 'Oculta', dataProperty: 'hiddenField', visible: false, sortable: false, alignment: 'left', widthFr: 5 },
      ];

      const fixture = createFixture();
      fixture.componentRef.setInput('columns', anchos);
      fixture.detectChanges();

      // La columna oculta no participa del reparto.
      expect(fixture.componentInstance.gridTemplateColumns).toBe(
        'minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 2fr)',
      );
    });
  });

  describe('actionsColumnName', () => {
    const accion: DataTableAction[] = [
      { action: 'detalle', actionDescription: 'Ver detalle', icon: 'task' },
    ];

    function headerAcciones(actionsColumnName?: string): HTMLElement | null {
      const fixture = createFixture();
      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', createRows());
      fixture.componentRef.setInput('actions', accion);
      if (actionsColumnName !== undefined) {
        fixture.componentRef.setInput('actionsColumnName', actionsColumnName);
      }
      fixture.detectChanges();

      const headers: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('p.text-xs.font-semibold'),
      );
      // La cabecera de acciones va siempre al final, despues de las columnas visibles.
      return headers[headers.length - 1] ?? null;
    }

    it('debe rotular "Acciones" por defecto', () => {
      expect(headerAcciones()?.textContent?.trim()).toBe('Acciones');
    });

    it('debe quedar sin texto cuando se le pasa cadena vacia', () => {
      // El <p> sigue existiendo: es lo que mantiene el alto de la celda alineado con el
      // resto de la cabecera.
      expect(headerAcciones('')?.textContent?.trim()).toBe('');
    });
  });

  describe('actionsColumnWidth', () => {
    const accion: DataTableAction[] = [
      { action: 'detalle', actionDescription: 'Ver detalle', icon: 'task' },
    ];

    function gridConAcciones(actionsColumnWidth?: string): string {
      const anchos: DataTableColumn[] = [
        { columnaName: 'Nombre', dataProperty: 'name', visible: true, sortable: false, alignment: 'left' },
      ];

      const fixture = createFixture();
      fixture.componentRef.setInput('columns', anchos);
      fixture.componentRef.setInput('actions', accion);
      if (actionsColumnWidth !== undefined) {
        fixture.componentRef.setInput('actionsColumnWidth', actionsColumnWidth);
      }
      fixture.detectChanges();

      return fixture.componentInstance.gridTemplateColumns;
    }

    it('debe reservar 128px por defecto', () => {
      expect(gridConAcciones()).toBe('minmax(0, 1fr) 128px');
    });

    it('debe respetar el ancho que le pase el consumidor', () => {
      // Con una sola accion, lo que sobra aqui se lo quita al reparto en fr del resto.
      expect(gridConAcciones('56px')).toBe('minmax(0, 1fr) 56px');
    });
  });

  describe('progressWidth', () => {
    const progressColumn: DataTableColumn = {
      columnaName: 'Avance',
      dataProperty: 'avance',
      visible: true,
      sortable: false,
      alignment: 'left',
      datatype: 'progress',
    };

    interface ProgressRow extends DataTableRow {
      avance: { value: number; percent?: number };
    }

    function renderProgress(data: ProgressRow[], rowsPerPage = 0) {
      const fixture = TestBed.createComponent(DbDataTableComponent<ProgressRow>);
      fixture.componentRef.setInput('columns', [progressColumn]);
      fixture.componentRef.setInput('data', data);
      if (rowsPerPage) fixture.componentRef.setInput('rowsPerPage', rowsPerPage);
      fixture.detectChanges();
      return fixture;
    }

    it('debe escalar las barras contra el mayor valor, que queda al 100%', () => {
      const fixture = renderProgress([
        { id: 1, avance: { value: 8 } },
        { id: 2, avance: { value: 4 } },
        { id: 3, avance: { value: 0 } },
      ]);

      const component = fixture.componentInstance;
      const filas = component.paginatedData;

      expect(component.progressWidth(filas[0], progressColumn)).toBe(100);
      expect(component.progressWidth(filas[1], progressColumn)).toBe(50);
      expect(component.progressWidth(filas[2], progressColumn)).toBe(0);
    });

    it('debe reescalar por pagina: el maximo es el de las filas visibles', () => {
      const fixture = renderProgress(
        [
          { id: 1, avance: { value: 8 } },
          { id: 2, avance: { value: 4 } },
          { id: 3, avance: { value: 2 } },
          { id: 4, avance: { value: 1 } },
        ],
        2,
      );

      const component = fixture.componentInstance;

      // Pagina 1: el maximo es 8.
      expect(component.progressWidth(component.paginatedData[1], progressColumn)).toBe(50);

      // Pagina 2: el maximo pasa a ser 2, asi que esa fila llega al 100%.
      component.goToPage(2);
      expect(component.progressWidth(component.paginatedData[0], progressColumn)).toBe(100);
      expect(component.progressWidth(component.paginatedData[1], progressColumn)).toBe(50);
    });

    it('el contenedor de la barra debe ocupar el ancho de la celda', () => {
      // Regresion: la celda es un contenedor flex y el div de *ngSwitchDefault no declaraba
      // ancho, asi que se ajustaba a su contenido y el % de la barra se medía contra el texto
      // del valor (el ancho acababa dependiendo de cuantos digitos tenia el numero).
      // jsdom no calcula layout, asi que se fija la estructura, que es lo que se rompio.
      const fixture = renderProgress([{ id: 1, avance: { value: 24 } }]);

      const barra = fixture.nativeElement.querySelector('div[style*="width"]') as HTMLElement;
      const pista = barra.parentElement as HTMLElement;
      const contenedor = pista.parentElement as HTMLElement;

      expect(pista.classList).toContain('w-full');
      expect(contenedor.classList).toContain('w-full');
    });

    it('no debe pintar nada en la barra cuando el valor es cero', () => {
      const fixture = renderProgress([
        { id: 1, avance: { value: 24 } },
        { id: 2, avance: { value: 0 } },
      ]);

      const barras = Array.from(
        fixture.nativeElement.querySelectorAll('.progress-bar-fill'),
      ) as HTMLElement[];

      expect(barras[0].textContent?.trim()).toBe('24');
      expect(barras[0].classList).toContain('px-2');

      expect(barras[1].textContent?.trim()).toBe('');
      // jsdom no calcula layout: la clase es la forma de fijar que la barra queda realmente a
      // cero. Con box-sizing:border-box, px-2 mantendria 16px de naranja pese al width 0%.
      expect(barras[1].classList).not.toContain('px-2');
    });

    it('debe respetar un percent explicito en lugar de escalar por pagina', () => {
      const fixture = renderProgress([
        { id: 1, avance: { value: 8, percent: 30 } },
        { id: 2, avance: { value: 4, percent: 150 } },
      ]);

      const component = fixture.componentInstance;

      expect(component.progressWidth(component.paginatedData[0], progressColumn)).toBe(30);
      // Fuera de rango: se recorta a 100.
      expect(component.progressWidth(component.paginatedData[1], progressColumn)).toBe(100);
    });
  });

  describe('identidad de fila y reencuadre de página', () => {
    const columnaSimple: DataTableColumn[] = [
      { columnaName: 'Nombre', dataProperty: 'name', visible: true, sortable: false, alignment: 'left' },
    ];

    /** Texto de cada celda renderizada, en orden. Con una sola columna hay una por fila. */
    function textos(fixture: { nativeElement: HTMLElement }): string[] {
      return celdas(fixture).map((celda) => celda.textContent?.trim() ?? '');
    }

    function celdas(fixture: { nativeElement: HTMLElement }): HTMLElement[] {
      return Array.from(fixture.nativeElement.querySelectorAll('p.text-theme-sm'));
    }

    function filas(cantidad: number): TestRow[] {
      return Array.from({ length: cantidad }, (_, i) => ({ id: i + 1, name: `Fila ${i + 1}` }));
    }

    it('debe conservar las filas existentes cuando entra una nueva por delante', () => {
      // Caso real: arranca una jornada nueva y su fila ordena antes que las que ya se ven. Con
      // `track $index` cada nodo pasaba a mostrar la fila siguiente, o sea que se reescribia
      // toda la tabla; trackeando por id solo se inserta la nueva.
      const fixture = createFixture();
      fixture.componentRef.setInput('columns', columnaSimple);
      fixture.componentRef.setInput('data', [
        { id: 'a', name: 'Ana' },
        { id: 'b', name: 'Beto' },
      ]);
      fixture.detectChanges();

      expect(textos(fixture)).toEqual(['Ana', 'Beto']);
      const celdaDeBeto = celdas(fixture)[1];

      // Objetos nuevos a proposito: es lo que devuelve el refetch, y el id es lo unico que
      // permite reconocerlos.
      fixture.componentRef.setInput('data', [
        { id: 'z', name: 'Zoe' },
        { id: 'a', name: 'Ana' },
        { id: 'b', name: 'Beto' },
      ]);
      fixture.detectChanges();

      expect(textos(fixture)).toEqual(['Zoe', 'Ana', 'Beto']);
      expect(celdas(fixture)[2]).toBe(celdaDeBeto);
      expect(celdaDeBeto.textContent?.trim()).toBe('Beto');
    });

    it('debe seguir renderizando bien las filas que no traen id', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('columns', columnaSimple);
      fixture.componentRef.setInput('data', [{ name: 'Ana' }, { name: 'Beto' }]);
      fixture.detectChanges();

      expect(textos(fixture)).toEqual(['Ana', 'Beto']);

      fixture.componentRef.setInput('data', [{ name: 'Zoe' }, { name: 'Ana' }, { name: 'Beto' }]);
      fixture.detectChanges();

      expect(textos(fixture)).toEqual(['Zoe', 'Ana', 'Beto']);
    });

    it('debe reencuadrar la página cuando el dataset encoge', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('columns', columnaSimple);
      fixture.componentRef.setInput('data', filas(25));
      fixture.componentRef.setInput('rowsPerPage', 10);
      fixture.detectChanges();

      const component = fixture.componentInstance;
      component.goToPage(3);
      expect(component.currentPage).toBe(3);

      // Un refresco deja menos filas: sin reencuadre la pagina 3 ya no existe, paginatedData
      // devuelve vacio y asoma el bloque @empty un instante antes de volver.
      fixture.componentRef.setInput('data', filas(12));
      fixture.detectChanges();

      expect(component.currentPage).toBe(2);
      expect(component.paginatedData.length).toBe(2);
    });

    it('debe centrar el mensaje de "sin resultados" a lo ancho y alto, también con columnas fusionadas', () => {
      // Regresion: con mergeRows el @empty cuelga del grid, asi que el mensaje caia dentro de
      // la primera columna (la mas estrecha) y pegado a la cabecera. jsdom no calcula layout,
      // de modo que se fija la estructura, que es lo que estaba mal.
      const conFusion: DataTableColumn[] = [
        { columnaName: 'Nombre', dataProperty: 'name', visible: true, sortable: false, alignment: 'left', mergeRows: true },
        { columnaName: 'Monto', dataProperty: 'amount', visible: true, sortable: false, alignment: 'right' },
      ];

      const fixture = createFixture();
      fixture.componentRef.setInput('columns', conFusion);
      fixture.componentRef.setInput('data', []);
      fixture.componentRef.setInput('noDataMessage', 'No hay jornadas registradas.');
      fixture.detectChanges();

      const mensaje = Array.from(
        fixture.nativeElement.querySelectorAll('span'),
      ).find((s) => (s as HTMLElement).textContent?.trim() === 'No hay jornadas registradas.') as HTMLElement;

      expect(mensaje).toBeTruthy();

      const caja = mensaje.parentElement as HTMLElement;
      expect(caja.classList).toContain('col-span-full'); // ocupa todo el ancho, no la 1a columna
      expect(caja.classList).toContain('items-center'); // centrado vertical
      expect(caja.classList).toContain('justify-center'); // centrado horizontal

      // El grid solo crece para dejar sitio al mensaje cuando no hay filas.
      const grid = caja.parentElement as HTMLElement;
      expect(grid.classList).toContain('flex-1');

      fixture.componentRef.setInput('data', filas(2));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.grid.flex-1')).toBeNull();
    });

    it('no debe tocar la página cuando el paginado es server-side y aún no llega totalPages', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('columns', columnaSimple);
      fixture.componentRef.setInput('data', filas(3));
      fixture.detectChanges();

      const component = fixture.componentInstance;
      component.currentPage = 3;

      fixture.componentRef.setInput('data', filas(3));
      fixture.detectChanges();

      // effectiveTotalPages cae a totalPages, que vale 0 mientras el consumidor no lo mande:
      // reencuadrar ahi perderia la pagina en la que esta el usuario.
      expect(component.currentPage).toBe(3);
    });
  });

  it('nextPage/prevPage deben respetar los límites de paginación y emitir currentPageEmit', () => {
    const rows: TestRow[] = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Fila ${i + 1}` }));

    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('rowsPerPage', 2);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const emitted: number[] = [];
    component.currentPageEmit.subscribe((page) => emitted.push(page));

    component.prevPage();
    expect(component.currentPage).toBe(1);

    component.nextPage();
    component.nextPage();
    component.nextPage();
    expect(component.currentPage).toBe(3);

    expect(emitted).toEqual([1, 2, 3, 3]);
  });

  describe('combo de registros por página', () => {
    // ngModel escribe el valor en el select dentro de un microtask, asi que hay que dejar
    // que se vacie la cola antes de leer selectedIndex: si no, llega como -1.
    async function renderCombo(inputs: Record<string, unknown> = {}) {
      const rows: TestRow[] = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Fila ${i + 1}` }));

      const fixture = createFixture();
      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', rows);
      fixture.componentRef.setInput('showToolbar', true);
      for (const [key, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(key, value);
      }
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    }

    function optionTexts(fixture: ReturnType<typeof createFixture>): string[] {
      const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
      return Array.from(select.options).map((o) => o.textContent?.trim() ?? '');
    }

    it('debe ofrecer 10, 20 y 50 por defecto', async () => {
      expect(optionTexts(await renderCombo())).toEqual(['10', '20', '50']);
    });

    it('debe respetar las opciones que pase el consumidor', async () => {
      const fixture = await renderCombo({ rowsPerPageOptions: [25, 100] });
      expect(optionTexts(fixture)).toEqual(['25', '100']);
    });

    it('debe añadir el rowsPerPage vigente a las opciones cuando no está en la lista', async () => {
      const fixture = await renderCombo({ rowsPerPage: 25 });

      // Sin esto el select no encontraria option coincidente y se veria en blanco.
      expect(optionTexts(fixture)).toEqual(['10', '20', '25', '50']);
      expect(fixture.componentInstance.rowsPerPageSelectOptions).toEqual([10, 20, 25, 50]);
    });

    it('debe mostrar seleccionado el rowsPerPage que pasó el consumidor, no siempre el primero', async () => {
      const fixture = await renderCombo({ rowsPerPage: 20 });
      const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

      expect(select.selectedIndex).toBe(1);
      expect(select.options[select.selectedIndex].textContent?.trim()).toBe('20');
    });

    it('onPerPageChange debe cambiar el tamaño, volver a la página 1 y emitir rowsPerPageEmit', async () => {
      const fixture = await renderCombo({ rowsPerPage: 10 });
      const component = fixture.componentInstance;

      component.goToPage(3);
      expect(component.currentPage).toBe(3);

      const emitted: number[] = [];
      component.rowsPerPageEmit.subscribe((size) => emitted.push(size));

      component.onPerPageChange(20);

      expect(component.rowsPerPage).toBe(20);
      expect(component.currentPage).toBe(1);
      expect(component.paginatedData.length).toBe(20);
      expect(emitted).toEqual([20]);
    });

    it('onPerPageChange no debe emitir ni tocar la página con el mismo valor o uno inválido', async () => {
      const fixture = await renderCombo({ rowsPerPage: 10 });
      const component = fixture.componentInstance;

      component.goToPage(2);
      const emitted: number[] = [];
      component.rowsPerPageEmit.subscribe((size) => emitted.push(size));

      component.onPerPageChange(10);
      component.onPerPageChange(0);
      component.onPerPageChange(-5);
      component.onPerPageChange('no-es-un-numero');

      expect(component.rowsPerPage).toBe(10);
      expect(component.currentPage).toBe(2);
      expect(emitted).toEqual([]);
    });

    it('debe mostrar el buscador por defecto y ocultarlo con showSearch en false', async () => {
      const buscador = (fixture: ReturnType<typeof createFixture>) =>
        fixture.nativeElement.querySelector('input[type="text"]');

      expect(buscador(await renderCombo())).not.toBeNull();
      expect(buscador(await renderCombo({ showSearch: false }))).toBeNull();
    });

    it('debe mostrar el boton Descargar por defecto y ocultarlo con showDownloadButton en false', async () => {
      const textoBoton = (fixture: ReturnType<typeof createFixture>) =>
        Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLElement>)
          .map((b) => b.textContent ?? '')
          .join(' ');

      expect(textoBoton(await renderCombo())).toContain('Descargar');
      expect(textoBoton(await renderCombo({ showDownloadButton: false }))).not.toContain(
        'Descargar',
      );
    });

    it('no debe emitir currentPageEmit al cambiar el tamaño, para no disparar dos recargas', async () => {
      const fixture = await renderCombo({ rowsPerPage: 10 });
      const component = fixture.componentInstance;

      component.goToPage(3);
      const paginas: number[] = [];
      component.currentPageEmit.subscribe((page) => paginas.push(page));

      component.onPerPageChange(50);

      expect(component.currentPage).toBe(1);
      expect(paginas).toEqual([]);
    });
  });

  it('debe respetar totalRows/totalPages del @Input cuando la paginación es server-side', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', createRows());
    fixture.componentRef.setInput('rowsPerPage', 0);
    fixture.componentRef.setInput('totalRows', 50);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.isClientPaginated).toBe(false);
    expect(component.effectiveTotalRows).toBe(50);
    expect(component.effectiveTotalPages).toBe(5);
    expect(component.paginatedData.length).toBe(3);
  });

  it('toggleAll/isAllSelected deben marcar y desmarcar todas las filas cuando no hay selectableRows', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', createRows());
    fixture.componentRef.setInput('selectMultiple', true);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.isAllSelected()).toBe(false);

    component.toggleAll(true);
    expect(component.paginatedData.every((r) => r.checked)).toBe(true);
    expect(component.isAllSelected()).toBe(true);

    component.toggleAll(false);
    expect(component.isAllSelected()).toBe(false);
  });

  it('isItemSelectable debe respetar selectableRows y toggleAll solo debe marcar filas seleccionables', () => {
    const rows = createRows();
    const selectableRows: SelectableRowsConfig = { columnName: 'status', values: ['A', 'P'] };

    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('selectMultiple', true);
    fixture.componentRef.setInput('selectableRows', selectableRows);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const [ana, beto, carla] = component.data;

    expect(component.isItemSelectable(ana)).toBe(true);
    expect(component.isItemSelectable(beto)).toBe(true);
    expect(component.isItemSelectable(carla)).toBe(false);

    component.toggleAll(true);
    expect(ana.checked).toBe(true);
    expect(beto.checked).toBe(true);
    expect(carla.checked).toBeUndefined();
    expect(component.isAllSelected()).toBe(true);
  });

  it('executeAction debe emitir emitAction con el nombre de la acción y la fila', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const row = createRows()[0];
    const emitted: Array<{ action: string; rowData: TestRow }> = [];
    component.emitAction.subscribe((event) => emitted.push(event));

    component.executeAction('editar', row);

    expect(emitted).toEqual([{ action: 'editar', rowData: row }]);
  });

  it('isActionEnabled/handleAction deben respetar enabledForStatuses', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const action: DataTableAction = {
      action: 'aprobar',
      actionDescription: 'Aprobar',
      icon: 'check',
      enabledForStatuses: ['P'],
    };
    const rows = createRows();
    const activeRow = rows[0];
    const pendingRow = rows[1];

    expect(component.isActionEnabled(action, pendingRow)).toBe(true);
    expect(component.isActionEnabled(action, activeRow)).toBe(false);

    const emitSpy = vi.spyOn(component.emitAction, 'emit');

    component.handleAction(action, activeRow);
    expect(emitSpy).not.toHaveBeenCalled();

    component.handleAction(action, pendingRow);
    expect(emitSpy).toHaveBeenCalledWith({ action: 'aprobar', rowData: pendingRow });
  });

  it('getFormattedValue debe formatear una columna number con separador de miles y moneda', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const amountColumn = columns[1];
    const row = createRows()[0];

    expect(component.getFormattedValue(row, amountColumn)).toBe('$ 1,500.50');
  });

  it('getFormattedValue debe formatear una columna datetime', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const dateColumn = columns[2];
    const row = createRows()[0];

    expect(component.getFormattedValue(row, dateColumn)).toBe('15/01/2026');
  });

  it('getCellObject debe devolver el objeto status o null si el valor no es un objeto', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const statusColumn = columns[3];
    const nameColumn = columns[0];
    const row = createRows()[0];

    expect(component.getCellObject(row, statusColumn)).toEqual({ code: 'A', description: 'Activo', color: 'green' });
    expect(component.getCellObject(row, nameColumn)).toBeNull();
  });

  it('onColumnDrop debe reordenar las columnas visibles y dejar las ocultas al final', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('reorderableColumns', true);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const dragEvent = { previousIndex: 0, currentIndex: 2 } as unknown as CdkDragDrop<DataTableColumn[]>;

    component.onColumnDrop(dragEvent);

    expect(component.columns.map((c) => c.dataProperty)).toEqual([
      'amount',
      'createdAt',
      'name',
      'status',
      'hiddenField',
    ]);
  });

  it('endEntry y effectiveTotalRows deben reflejar las filas en memoria sin totalRows', () => {
    // Con menos filas que rowsPerPage no hay paginacion de cliente; sin el input totalRows el
    // pie mostraba "del 1 al 0 de 0 registros" teniendo filas en pantalla.
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', createRows());
    fixture.componentRef.setInput('rowsPerPage', 10);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.effectiveTotalRows).toBe(3);
    expect(component.startEntry).toBe(1);
    expect(component.endEntry).toBe(3);
  });

  it('onColumnDrop no debe reordenar columnas cuando reorderableColumns es false', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('reorderableColumns', false);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const dragEvent = { previousIndex: 0, currentIndex: 2 } as unknown as CdkDragDrop<DataTableColumn[]>;

    component.onColumnDrop(dragEvent);

    expect(component.columns.map((c) => c.dataProperty)).toEqual([
      'name',
      'amount',
      'createdAt',
      'status',
      'hiddenField',
    ]);
  });

  describe('mergeRows', () => {
    // La rama de celdas fusionadas coloca cada celda en una posicion explicita del grid, asi
    // que los tests miran el DOM: el fallo que motivo estos casos (usar $index dentro del
    // @for de columnas, que ahi es el indice de columna) no se ve desde la API del componente.
    // Dos columnas fusionables en jerarquia, igual que "Subprocesos" + "Operador" en reportes.
    const mergeColumns: DataTableColumn[] = [
      { columnaName: 'Grupo', dataProperty: 'grupo', visible: true, sortable: false, alignment: 'left', mergeRows: true },
      { columnaName: 'Nombre', dataProperty: 'name', visible: true, sortable: false, alignment: 'left', mergeRows: true },
    ];

    interface MergeRow extends DataTableRow {
      grupo: string;
      name: string;
    }

    function renderMerged(data: MergeRow[]) {
      const fixture = TestBed.createComponent(DbDataTableComponent<MergeRow>);
      fixture.componentRef.setInput('columns', mergeColumns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();
      return fixture;
    }

    /** Celdas de la columna indicada (1-based en el grid), en orden de aparicion. */
    function cellsOfColumn(fixture: ReturnType<typeof renderMerged>, gridColumn: number): HTMLElement[] {
      const cells = Array.from(
        fixture.nativeElement.querySelectorAll('div[style*="grid-row"]'),
      ) as HTMLElement[];
      return cells.filter((cell) => cell.style.gridColumn === String(gridColumn));
    }

    it('debe colocar cada fila en una fila distinta del grid, sin superponerlas', () => {
      const fixture = renderMerged([
        { id: 1, grupo: 'Previos', name: 'Ana' },
        { id: 2, grupo: 'Previos', name: 'Beto' },
        { id: 3, grupo: 'Previos', name: 'Carla' },
      ]);

      const filas = cellsOfColumn(fixture, 2).map((cell) => cell.style.gridRow);

      expect(filas).toEqual(['1', '2', '3']);
      expect(new Set(filas).size).toBe(filas.length);
    });

    it('debe fusionar celdas consecutivas con el mismo valor usando span', () => {
      const fixture = renderMerged([
        { id: 1, grupo: 'Previos', name: 'Ana' },
        { id: 2, grupo: 'Previos', name: 'Beto' },
        { id: 3, grupo: 'Acabados', name: 'Carla' },
      ]);

      const grupos = cellsOfColumn(fixture, 1);

      // Dos celdas para tres filas: "Previos" abarca las dos primeras, "Acabados" la tercera.
      expect(grupos.length).toBe(2);
      expect(grupos[0].style.gridRow).toContain('span 2');
      expect(grupos[1].style.gridRow).toBe('3');
    });

    it('no debe fusionar a traves de un cambio de la columna anterior en la jerarquia', () => {
      const fixture = renderMerged([
        { id: 1, grupo: 'Previos', name: 'Ana' },
        { id: 2, grupo: 'Acabados', name: 'Ana' },
      ]);

      const component = fixture.componentInstance;

      // Mismo valor en la columna 2, pero el grupo cambia: cada fila conserva su celda.
      expect(component.showCell(mergeColumns[1], 1)).toBe(true);
      expect(cellsOfColumn(fixture, 2).length).toBe(2);
    });
  });
});
