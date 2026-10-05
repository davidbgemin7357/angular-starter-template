import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DbDatePickerComponent } from './db-date-picker.component';

// NOTA: este componente inicializa flatpickr (manipulación de DOM fuera del ciclo de
// change detection de Angular) en ngAfterViewInit. flatpickr se inicializa correctamente
// sobre jsdom (no depende de layout real), por lo que sí ejecutamos fixture.detectChanges()
// para cubrir la integración básica. Sin embargo, se evita deliberadamente simular clics
// sobre las celdas del calendario visual (posicionamiento/scroll dependen de layout real
// que jsdom no calcula de forma fiable) y en su lugar se prueba la lógica pública del
// componente: ControlValueAccessor, ngOnChanges y los métodos de formateo/limpieza.
describe('DbDatePickerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbDatePickerComponent],
    }).compileComponents();
  });

  function createComponent(
    mode: DbDatePickerComponent['mode'] = 'single',
    configure?: (instance: DbDatePickerComponent) => void,
  ) {
    const fixture = TestBed.createComponent(DbDatePickerComponent);
    fixture.componentInstance.id = 'test-date-picker';
    fixture.componentInstance.mode = mode;
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the component and initialize the underlying input', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
    const input = fixture.nativeElement.querySelector('input');
    expect(input).not.toBeNull();
  });

  it('should render the label with the required marker when provided', () => {
    const fixture = createComponent('single', (instance) => {
      instance.label = 'Fecha de inicio';
      instance.required = true;
    });

    const label = fixture.nativeElement.querySelector('label');
    expect(label?.textContent).toContain('Fecha de inicio');
    expect(label?.querySelector('span')?.textContent).toContain('*');
  });

  it('should notify onChange/onTouched via ControlValueAccessor when clear() is invoked', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const onChangeSpy = vi.fn();
    const onTouchedSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    component.clear();

    expect(onChangeSpy).toHaveBeenCalledWith('');
    expect(onTouchedSpy).toHaveBeenCalled();
    expect(component.hasValue).toBe(false);
  });

  it('should render each selected date in its own span in multiple mode and hide the input', () => {
    const fixture = createComponent('multiple', (instance) => {
      instance.value = ['2026-07-01', '2026-07-15', '2026-08-31'];
    });

    const spans = fixture.nativeElement.querySelectorAll('[role="button"] span');
    expect(Array.from(spans).map((s) => (s as HTMLElement).textContent?.trim())).toEqual([
      '2026-07-01,',
      '2026-07-15,',
      '2026-08-31',
    ]);
    expect(fixture.nativeElement.querySelector('input').classList.contains('sr-only')).toBe(true);
  });

  it('should reflect the disabled state in setDisabledState and inputClasses', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.setDisabledState!(true);

    expect(component.disabled).toBe(true);
    expect(component.inputClasses).toContain('cursor-not-allowed');
  });

  it('should accept writeValue before the view is initialized without throwing', () => {
    const fixture = TestBed.createComponent(DbDatePickerComponent);
    fixture.componentInstance.id = 'test-date-picker-early';

    expect(() => fixture.componentInstance.writeValue('11/07/2026')).not.toThrow();
  });

  it('should update the displayed date on ngOnChanges for a valid single-mode value', () => {
    const fixture = createComponent('single');
    const component = fixture.componentInstance;

    component.value = '11/07/2026';
    component.ngOnChanges({
      value: new SimpleChange(undefined, component.value, false),
    });

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('2026-07-11');
  });

  it('should log an error and not throw when ngOnChanges receives a malformed single-mode date', () => {
    const fixture = createComponent('single');
    const component = fixture.componentInstance;
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    component.value = 'not-a-date';
    expect(() =>
      component.ngOnChanges({
        value: new SimpleChange(undefined, component.value, false),
      })
    ).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should clear the visible date without emitting onChange when writeValue(null) is called', () => {
    const fixture = createComponent('single');
    const component = fixture.componentInstance;
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    component.writeValue('2026-07-11');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('2026-07-11');

    component.formatError = true;
    component.writeValue(null);

    expect(input.value).toBe('');
    expect(component.hasValue).toBe(false);
    expect(component.formatError).toBe(false);
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it('should emit local YYYY-MM-DD strings (not ISO UTC) on onChange in range mode', () => {
    const fixture = createComponent('range');
    const component = fixture.componentInstance;
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    const instance = (component as any).flatpickrInstance;
    instance.setDate([new Date(2026, 6, 1), new Date(2026, 6, 10)], true);

    expect(onChangeSpy).toHaveBeenLastCalledWith(['2026-07-01', '2026-07-10']);
  });

  it('should emit local DD-MM-YYYY strings on onChange in multiple mode with format dmy', () => {
    const fixture = createComponent('multiple', (instance) => {
      instance.format = 'dmy';
    });
    const component = fixture.componentInstance;
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    const instance = (component as any).flatpickrInstance;
    instance.setDate([new Date(2026, 0, 1), new Date(2026, 1, 28)], true);

    expect(onChangeSpy).toHaveBeenLastCalledWith(['01-01-2026', '28-02-2026']);
  });

  it('should restore local date strings (and legacy ISO strings) via writeValue in range mode', () => {
    const fixture = createComponent('range');
    const component = fixture.componentInstance;
    const instance = (component as any).flatpickrInstance;

    component.writeValue(['2026-07-01', '2026-07-10']);
    const selected = instance.selectedDates as Date[];
    expect(selected.map((d) => [d.getFullYear(), d.getMonth(), d.getDate()])).toEqual([
      [2026, 6, 1],
      [2026, 6, 10],
    ]);

    const legacy = [new Date(2026, 6, 2).toISOString(), new Date(2026, 6, 12).toISOString()];
    component.writeValue(legacy);
    expect((instance.selectedDates as Date[]).map((d) => d.getDate())).toEqual([2, 12]);
  });

  it('should accept a YYYY-MM-DD HH:mm value in datetime mode', () => {
    const fixture = createComponent('datetime');
    const component = fixture.componentInstance;

    component.value = '2026-07-11 14:30';
    component.ngOnChanges({
      value: new SimpleChange(undefined, component.value, false),
    });

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('2026-07-11 14:30');
  });

  it('should still accept a dd/mm/YYYY HH:mm:ss value in datetime mode', () => {
    const fixture = createComponent('datetime');
    const component = fixture.componentInstance;

    component.value = '11/07/2026 14:30:45';
    component.ngOnChanges({
      value: new SimpleChange(undefined, component.value, false),
    });

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('2026-07-11 14:30:45');
  });

  it('should accept a dd/mm/YYYY value via writeValue in single mode', () => {
    const fixture = createComponent('single');
    const component = fixture.componentInstance;

    component.writeValue('11/07/2026');

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('2026-07-11');
  });
});
