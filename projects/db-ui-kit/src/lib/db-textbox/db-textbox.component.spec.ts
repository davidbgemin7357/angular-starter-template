import { TestBed } from '@angular/core/testing';
import { DbTextBoxComponent } from './db-textbox.component';

describe('DbTextBoxComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbTextBoxComponent],
    }).compileComponents();
  });

  function createComponent(): DbTextBoxComponent {
    const fixture = TestBed.createComponent(DbTextBoxComponent);
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
    component.writeValue('hola mundo');
    expect(component.value).toBe('hola mundo');
  });

  it('writeValue usa cadena vacía cuando recibe null/undefined', () => {
    const component = createComponent();
    component.writeValue(null);
    expect(component.value).toBe('');
  });

  it('onInput actualiza value, invoca registerOnChange y emite valueChange', () => {
    const component = createComponent();
    const onChangeSpy = vi.fn();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChangeSpy);

    component.onInput(buildInputEvent('texto nuevo'));

    expect(component.value).toBe('texto nuevo');
    expect(onChangeSpy).toHaveBeenCalledWith('texto nuevo');
    expect(emitSpy).toHaveBeenCalledWith('texto nuevo');
  });

  it('onInput filtra caracteres que no cumplen con la regexp provista', () => {
    const component = createComponent();
    component.regexp = /[0-9]/;

    component.onInput(buildInputEvent('a1b2c3'));

    expect(component.value).toBe('123');
  });

  it('registerOnTouched registra el callback usado por onTouched', () => {
    const component = createComponent();
    const onTouchedSpy = vi.fn();
    component.registerOnTouched(onTouchedSpy);

    component.onTouched();

    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('setDisabledState actualiza disabled', () => {
    const component = createComponent();
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('clearValue() limpia el value y emite valueChange vacío cuando no está deshabilitado', () => {
    const component = createComponent();
    component.value = 'algo';
    const onChangeSpy = vi.fn();
    const onTouchedSpy = vi.fn();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    component.clearValue();

    expect(component.value).toBe('');
    expect(onChangeSpy).toHaveBeenCalledWith('');
    expect(emitSpy).toHaveBeenCalledWith('');
    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('clearValue() no hace nada si el componente está deshabilitado', () => {
    const component = createComponent();
    component.value = 'algo';
    component.disabled = true;
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.clearValue();

    expect(component.value).toBe('algo');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('handleBlur marca emailFormatError cuando type="email" y el texto no tiene formato de correo', () => {
    const component = createComponent();
    component.type = 'email';
    component.value = 'no-es-un-correo';

    component.handleBlur();

    expect(component.emailFormatError).toBe(true);
    expect(component.computedError).toBe(true);
    expect(component.computedHint).toBe('Ingresa un correo electrónico válido.');
  });

  it('handleBlur no marca error cuando el correo tiene formato válido', () => {
    const component = createComponent();
    component.type = 'email';
    component.value = 'persona@ejemplo.com';

    component.handleBlur();

    expect(component.emailFormatError).toBe(false);
    expect(component.computedError).toBe(false);
  });

  it('handleBlur no marca error para type="email" cuando el campo está vacío', () => {
    const component = createComponent();
    component.type = 'email';
    component.value = '';

    component.handleBlur();

    expect(component.emailFormatError).toBe(false);
  });

  it('handleBlur no valida formato de correo cuando type no es "email"', () => {
    const component = createComponent();
    component.type = 'text';
    component.value = 'cualquier texto';

    component.handleBlur();

    expect(component.emailFormatError).toBe(false);
  });

  it('onInput limpia emailFormatError apenas el usuario vuelve a escribir', () => {
    const component = createComponent();
    component.type = 'email';
    component.value = 'no-es-un-correo';
    component.handleBlur();
    expect(component.emailFormatError).toBe(true);

    component.onInput(buildInputEvent('a'));

    expect(component.emailFormatError).toBe(false);
  });

  it('el [hint] explícito del padre tiene prioridad sobre el mensaje de formato de correo', () => {
    const component = createComponent();
    component.type = 'email';
    component.value = 'no-es-un-correo';
    component.hint = 'El correo es obligatorio';
    component.handleBlur();

    expect(component.computedHint).toBe('El correo es obligatorio');
  });
});
