import { TestBed } from '@angular/core/testing';
import { DbConfirmModalComponent } from './db-confirm-modal.component';
import { resetBodyScrollLock } from '../utils/scroll-lock';

describe('DbConfirmModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbConfirmModalComponent],
    }).compileComponents();
  });

  afterEach(() => {
    resetBodyScrollLock();
    vi.useRealTimers();
  });

  it('should create the component without rendering the modal when isOpen is false', () => {
    const fixture = TestBed.createComponent(DbConfirmModalComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.shouldRender).toBe(false);
    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
  });

  it('should render the modal and lock body scroll on init when isOpen is true', () => {
    const fixture = TestBed.createComponent(DbConfirmModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.componentInstance.message = 'Un mensaje de confirmación';
    fixture.detectChanges();

    expect(fixture.componentInstance.shouldRender).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(fixture.nativeElement.querySelector('.modal-backdrop')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Un mensaje de confirmación');
  });

  it('should emit close when clicking the backdrop with hideOnOutsideClick enabled', () => {
    const fixture = TestBed.createComponent(DbConfirmModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();
    const closeSpy = vi.fn();
    fixture.componentInstance.close.subscribe(closeSpy);

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should not emit close on backdrop click when hideOnOutsideClick is false', () => {
    const fixture = TestBed.createComponent(DbConfirmModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.componentInstance.hideOnOutsideClick = false;
    fixture.detectChanges();
    const closeSpy = vi.fn();
    fixture.componentInstance.close.subscribe(closeSpy);

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should emit close when pressing Escape while open', () => {
    const fixture = TestBed.createComponent(DbConfirmModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();
    const closeSpy = vi.fn();
    fixture.componentInstance.close.subscribe(closeSpy);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should emit confirm(true) and confirm(false) when clicking the Confirmar/Cancelar buttons', () => {
    const fixture = TestBed.createComponent(DbConfirmModalComponent);
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();
    const confirmSpy = vi.fn();
    fixture.componentInstance.confirm.subscribe(confirmSpy);

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const confirmButton = buttons.find((btn) => btn.textContent?.includes('Confirmar'));
    const cancelButton = buttons.find((btn) => btn.textContent?.includes('Cancelar'));

    confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(confirmSpy).toHaveBeenNthCalledWith(1, true);
    expect(confirmSpy).toHaveBeenNthCalledWith(2, false);
  });

  it('should hide immediately and unmount after the transition delay when isOpen becomes false', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(DbConfirmModalComponent);
    const component = fixture.componentInstance;
    // Simulate an already-open, fully-visible modal without depending on requestAnimationFrame.
    component.shouldRender = true;
    component.isVisible = true;
    component.isOpen = false;

    component.ngOnChanges();

    expect(component.isVisible).toBe(false);
    expect(component.shouldRender).toBe(true);

    vi.advanceTimersByTime(200);

    expect(component.shouldRender).toBe(false);
    vi.useRealTimers();
  });
});
