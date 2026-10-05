import { TestBed } from '@angular/core/testing';
import { DbNumberBoxComponent } from './db-numberbox.component';

describe('DbNumberBoxComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbNumberBoxComponent],
    }).compileComponents();
  });

  function createComponent(): DbNumberBoxComponent {
    const fixture = TestBed.createComponent(DbNumberBoxComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  function buildInputEvent(value: string): Event {
    return { target: { value } as unknown as HTMLInputElement } as unknown as Event;
  }

  it('debería crearse', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
  });

  it('writeValue actualiza el value interno', () => {
    const component = createComponent();
    component.writeValue(42);
    expect(component.value).toBe(42);
  });

  it('writeValue usa cadena vacía cuando recibe null/undefined', () => {
    const component = createComponent();
    component.writeValue(null);
    expect(component.value).toBe('');
  });

  it('onInput respeta el límite máximo definido por @Input max', () => {
    const component = createComponent();
    component.max = '10';
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    component.onInput(buildInputEvent('50'));

    expect(component.value).toBe(10);
    expect(onChangeSpy).toHaveBeenCalledWith(10);
  });

  it('con min, onInput deja escribir valores intermedios menores (min=10, "2" → "25")', () => {
    const component = createComponent();
    component.min = '10';

    component.onInput(buildInputEvent('2'));
    expect(component.value).toBe(2);

    component.onInput(buildInputEvent('25'));
    expect(component.value).toBe(25);
  });

  it('onBlur lleva al mínimo un valor menor que min y marca touched', () => {
    const component = createComponent();
    component.min = '5';
    const onChangeSpy = vi.fn();
    const onTouchedSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    const input = { value: '1' } as HTMLInputElement;
    component.onInput({ target: input } as unknown as Event);
    component.onBlur({ target: input } as unknown as FocusEvent);

    expect(component.value).toBe(5);
    expect(input.value).toBe('5');
    expect(onChangeSpy).toHaveBeenLastCalledWith(5);
    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('onInput emite valueChange con el número parseado', () => {
    const component = createComponent();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.onInput(buildInputEvent('123'));

    expect(emitSpy).toHaveBeenCalledWith(123);
  });

  it('setDisabledState actualiza disabled', () => {
    const component = createComponent();
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('clearValue() limpia el value y emite valueChange vacío cuando no está deshabilitado', () => {
    const component = createComponent();
    component.value = 7;
    const onChangeSpy = vi.fn();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChangeSpy);

    component.clearValue();

    expect(component.value).toBe('');
    expect(onChangeSpy).toHaveBeenCalledWith('');
    expect(emitSpy).toHaveBeenCalledWith('');
  });

  it('clearValue() no hace nada si el componente está deshabilitado', () => {
    const component = createComponent();
    component.value = 7;
    component.disabled = true;
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.clearValue();

    expect(component.value).toBe(7);
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
