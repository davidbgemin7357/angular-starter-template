import { TestBed } from '@angular/core/testing';
import { DbTextAreaComponent } from './db-text-area.component';

describe('DbTextAreaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbTextAreaComponent],
    }).compileComponents();
  });

  function createComponent(): DbTextAreaComponent {
    const fixture = TestBed.createComponent(DbTextAreaComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  function buildInputEvent(value: string): Event {
    return { target: { value } as unknown as HTMLTextAreaElement } as unknown as Event;
  }

  it('debería crearse', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
  });

  it('writeValue actualiza el value interno', () => {
    const component = createComponent();
    component.writeValue('contenido inicial');
    expect(component.value).toBe('contenido inicial');
  });

  it('writeValue usa cadena vacía cuando recibe null/undefined', () => {
    const component = createComponent();
    component.writeValue(null as unknown as string);
    expect(component.value).toBe('');
  });

  it('onInput actualiza value, invoca registerOnChange/registerOnTouched y emite valueChange', () => {
    const component = createComponent();
    const onChangeSpy = vi.fn();
    const onTouchedSpy = vi.fn();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    component.onInput(buildInputEvent('nuevo texto'));

    expect(component.value).toBe('nuevo texto');
    expect(onChangeSpy).toHaveBeenCalledWith('nuevo texto');
    expect(onTouchedSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('nuevo texto');
  });

  it('onInput filtra caracteres que no cumplen con la regexp provista (RegExp)', () => {
    const component = createComponent();
    component.regexp = /[0-9]/;
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    const event = buildInputEvent('a1b2c3');

    component.onInput(event);

    expect(component.value).toBe('123');
    expect((event.target as HTMLTextAreaElement).value).toBe('123');
    expect(emitSpy).toHaveBeenCalledWith('123');
  });

  it('onInput acepta la regexp como string', () => {
    const component = createComponent();
    component.regexp = '[a-z ]';

    component.onInput(buildInputEvent('hola 123 mundo'));

    expect(component.value).toBe('hola  mundo');
  });

  it('onInput conserva los saltos de línea aunque la regexp no los incluya', () => {
    const component = createComponent();
    component.regexp = /[a-z]/;

    component.onInput(buildInputEvent('ab1\ncd2'));

    expect(component.value).toBe('ab\ncd');
  });

  it('setDisabledState actualiza disabled', () => {
    const component = createComponent();
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('clearValue() limpia el value y emite valueChange vacío cuando no está deshabilitado', () => {
    const component = createComponent();
    component.value = 'algo escrito';
    const onChangeSpy = vi.fn();
    const onTouchedSpy = vi.fn();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    component.clearValue();

    expect(component.value).toBe('');
    expect(onChangeSpy).toHaveBeenCalledWith('');
    expect(onTouchedSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('');
  });

  it('clearValue() no hace nada si el componente está deshabilitado', () => {
    const component = createComponent();
    component.value = 'algo escrito';
    component.disabled = true;
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.clearValue();

    expect(component.value).toBe('algo escrito');
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
