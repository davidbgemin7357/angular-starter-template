import { TestBed } from '@angular/core/testing';
import { DbFileInputComponent } from './db-file-input.component';
import { FileInputResult } from './db-file-input.interface';

describe('DbFileInputComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbFileInputComponent],
    }).compileComponents();
  });

  function createComponent(): DbFileInputComponent {
    const fixture = TestBed.createComponent(DbFileInputComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  function buildChangeEvent(files: File[]): Event {
    return {
      target: { files } as unknown as HTMLInputElement,
    } as unknown as Event;
  }

  it('debería crearse', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
  });

  it('con disabled aplica estilo tenue y cursor-not-allowed al contenedor y al botón', () => {
    const fixture = TestBed.createComponent(DbFileInputComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector(':scope > div > div') as HTMLDivElement;
    const button = container.querySelector('button') as HTMLButtonElement;

    expect(container.classList.contains('opacity-60')).toBe(true);
    expect(button.classList.contains('cursor-not-allowed')).toBe(true);
    expect(button.classList.contains('cursor-pointer')).toBe(false);
  });

  it('rechaza un archivo con extensión no permitida', () => {
    const component = createComponent();
    component.allowedExtensions = ['.png'];
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    const file = new File(['contenido'], 'foo.txt', { type: 'text/plain' });
    component.onChange(buildChangeEvent([file]));

    expect(component.errorMessage).toContain('Extensión no permitida');
    expect(component.selectedFiles).toEqual([]);
    expect(emitSpy).toHaveBeenCalledWith({ file: [], error: component.errorMessage });
  });

  it('rechaza un archivo que excede el tamaño máximo', () => {
    const component = createComponent();
    component.allowedExtensions = ['.png'];
    component.maxSizeMB = 0.000001;
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    const file = new File(['contenido-grande'], 'foo.png', { type: 'image/png' });
    component.onChange(buildChangeEvent([file]));

    expect(component.errorMessage).toContain('excede el tamaño máximo');
    expect(component.selectedFiles).toEqual([]);
    expect(emitSpy).toHaveBeenCalledWith({ file: [], error: component.errorMessage });
  });

  it('acepta un archivo válido y emite valueChange con error null', () => {
    const component = createComponent();
    component.allowedExtensions = ['.png'];
    component.maxSizeMB = 1;
    const onChangeSpy = vi.fn();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChangeSpy);

    const file = new File(['contenido'], 'foo.png', { type: 'image/png' });
    component.onChange(buildChangeEvent([file]));

    expect(component.selectedFiles).toEqual([file]);
    expect(component.selectedFileName).toBe('foo.png');
    expect(onChangeSpy).toHaveBeenCalledWith([file]);
    const emittedResult = emitSpy.mock.calls[0][0] as FileInputResult;
    expect(emittedResult.error).toBeNull();
    expect(emittedResult.file).toEqual([file]);
  });

  it('reset() limpia el estado interno del componente', () => {
    const component = createComponent();
    component.allowedExtensions = ['.png'];
    const file = new File(['contenido'], 'foo.png', { type: 'image/png' });
    component.onChange(buildChangeEvent([file]));

    component.reset();

    expect(component.selectedFiles).toEqual([]);
    expect(component.selectedFileName).toBeNull();
    expect(component.errorMessage).toBeNull();
  });

  it('clearValue() resetea y emite valueChange cuando no está deshabilitado', () => {
    const component = createComponent();
    component.allowedExtensions = ['.png'];
    const file = new File(['contenido'], 'foo.png', { type: 'image/png' });
    component.onChange(buildChangeEvent([file]));

    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    component.clearValue();

    expect(component.selectedFiles).toEqual([]);
    expect(component.selectedFileName).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith({ file: [], error: null });
  });

  it('clearValue() no hace nada si el componente está deshabilitado', () => {
    const component = createComponent();
    component.allowedExtensions = ['.png'];
    const file = new File(['contenido'], 'foo.png', { type: 'image/png' });
    component.onChange(buildChangeEvent([file]));

    component.disabled = true;
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
    component.clearValue();

    expect(component.selectedFiles).toEqual([file]);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('writeValue actualiza selectedFiles/selectedFileName y setDisabledState actualiza disabled', () => {
    const component = createComponent();
    const file = new File(['contenido'], 'bar.pdf', { type: 'application/pdf' });

    component.writeValue([file]);
    expect(component.selectedFiles).toEqual([file]);
    expect(component.selectedFileName).toBe('bar.pdf');

    component.writeValue(null);
    expect(component.selectedFiles).toEqual([]);
    expect(component.selectedFileName).toBeNull();

    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('registerOnTouched registra el callback y se invoca al emitir un resultado', () => {
    const component = createComponent();
    component.allowedExtensions = ['.png'];
    const onTouchedSpy = vi.fn();
    component.registerOnTouched(onTouchedSpy);

    const file = new File(['contenido'], 'foo.png', { type: 'image/png' });
    component.onChange(buildChangeEvent([file]));

    expect(onTouchedSpy).toHaveBeenCalled();
  });
});
