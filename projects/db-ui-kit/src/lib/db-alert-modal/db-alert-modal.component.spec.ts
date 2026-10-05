import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DbAlertModalComponent } from './db-alert-modal.component';
import { resetBodyScrollLock } from '../utils/scroll-lock';

describe('DbAlertModalComponent', () => {
  let fixture: ComponentFixture<DbAlertModalComponent>;
  let component: DbAlertModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbAlertModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DbAlertModalComponent);
    component = fixture.componentInstance;
    vi.useFakeTimers();
  });

  afterEach(() => {
    fixture.destroy();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    resetBodyScrollLock();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('no debe renderizar el modal cuando isOpen es false (valor por defecto)', () => {
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeNull();
  });

  it('al abrir (isOpen=true) bloquea el scroll del body y renderiza el modal', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    vi.runOnlyPendingTimers();
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('hidden');
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).not.toBeNull();
  });

  it('al cerrar tras estar abierto, restaura el overflow y luego de la transicion deja de renderizar', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    vi.runOnlyPendingTimers();
    fixture.detectChanges();

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    expect(document.body.style.overflow).toBe('');
    expect(fixture.nativeElement.querySelector('.modal')).not.toBeNull();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('emite close al hacer click en el backdrop cuando hideOnOutsideClick es true', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    vi.runOnlyPendingTimers();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
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
    vi.runOnlyPendingTimers();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('emite accept al hacer click en el boton de aceptar (db-button)', () => {
    const acceptSpy = vi.fn();
    component.accept.subscribe(acceptSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    vi.runOnlyPendingTimers();
    fixture.detectChanges();

    const acceptButton = fixture.nativeElement.querySelector('db-button button') as HTMLElement;
    expect(acceptButton).not.toBeNull();
    acceptButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(acceptSpy).toHaveBeenCalledTimes(1);
  });

  it('emite close al presionar Escape cuando el modal esta abierto', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    vi.runOnlyPendingTimers();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('calcula el icono y la clase de color segun el modo (mode)', () => {
    fixture.componentRef.setInput('mode', 'danger');
    fixture.detectChanges();

    expect(component.modeIcon).toBe('error');
    expect(component.modeIconColorClass).toBe('text-error-500');
  });
});
