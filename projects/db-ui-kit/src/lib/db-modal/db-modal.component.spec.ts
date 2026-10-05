import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DbModalComponent } from './db-modal.component';
import { resetBodyScrollLock } from '../utils/scroll-lock';

describe('DbModalComponent', () => {
  let fixture: ComponentFixture<DbModalComponent>;
  let component: DbModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DbModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    resetBodyScrollLock();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('no debe renderizar contenido cuando isOpen es false (valor por defecto)', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('al abrir (isOpen=true) bloquea el scroll del body y renderiza el modal', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('hidden');
    expect(fixture.nativeElement.querySelector('.modal')).not.toBeNull();
  });

  it('al cerrar (isOpen=false tras estar abierto) restaura el overflow y deja de renderizar tras la animación', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('');
    // Sigue montado mientras dura la animación de salida.
    expect(fixture.nativeElement.querySelector('.modal')).not.toBeNull();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
    vi.useRealTimers();
  });

  it('anima la entrada: agrega modal-visible al backdrop y al contenido en el siguiente frame', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('.modal-content') as HTMLElement;
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    expect(content.classList.contains('modal-visible')).toBe(false);

    vi.advanceTimersToNextFrame();
    fixture.detectChanges();
    expect(content.classList.contains('modal-visible')).toBe(true);
    expect(backdrop.classList.contains('modal-visible')).toBe(true);

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    expect(content.classList.contains('modal-visible')).toBe(false);
    vi.useRealTimers();
  });

  it('emite close al hacer click en el backdrop cuando hideOnOutsideClick es true', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(
      '.fixed.inset-0.h-full.w-full'
    ) as HTMLElement;
    expect(backdrop).not.toBeNull();
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('no emite close al hacer click en el backdrop cuando hideOnOutsideClick es false', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('hideOnOutsideClick', false);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(
      '.fixed.inset-0.h-full.w-full'
    ) as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('el boton de cerrar es type="button" (dentro de un <form> no debe enviarlo)', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Detalle');
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((b) => b.type === 'button')).toBe(true);
  });

  it('emite close al hacer click en el boton de cerrar', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(closeButton).not.toBeNull();
    closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('emite close al presionar Escape cuando el modal esta abierto', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('no emite close al presionar Escape cuando el modal esta cerrado', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closeSpy).not.toHaveBeenCalled();
  });
});
