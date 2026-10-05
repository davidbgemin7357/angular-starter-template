import { TestBed } from '@angular/core/testing';
import { DbToastComponent } from './db-toast.component';

describe('DbToastComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbToastComponent],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(DbToastComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the component with the default "info" variant', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.variant).toBe('info');
  });

  it('should render the message text', () => {
    const fixture = createComponent();
    fixture.componentRef.setInput('message', 'Operación exitosa');
    fixture.detectChanges();
    const messageEl = fixture.nativeElement.querySelector('.message');
    expect(messageEl?.textContent?.trim()).toBe('Operación exitosa');
  });

  it('should become visible and apply the "show" class when visible is set to true', () => {
    const fixture = createComponent();
    fixture.componentInstance.visible = true;
    fixture.detectChanges();

    expect(fixture.componentInstance.visible).toBe(true);
    const container = fixture.nativeElement.querySelector('.toast-container');
    expect(container?.classList.contains('show')).toBe(true);
  });

  it('should auto-hide after the configured "time" elapses', () => {
    vi.useFakeTimers();
    const fixture = createComponent();
    fixture.componentInstance.time = 1000;
    fixture.componentInstance.visible = true;
    fixture.detectChanges();
    expect(fixture.componentInstance.visible).toBe(true);

    vi.advanceTimersByTime(1000);

    expect(fixture.componentInstance.visible).toBe(false);
    vi.useRealTimers();
  });

  it('should hide immediately and clear the pending timer when visible is set to false', () => {
    vi.useFakeTimers();
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.time = 5000;
    component.visible = true;

    component.visible = false;

    expect(component.visible).toBe(false);
    // Advancing time should not throw and should not "re-show" the toast.
    vi.advanceTimersByTime(5000);
    expect(component.visible).toBe(false);
    vi.useRealTimers();
  });

  it('should map each variant to its expected variantClass and iconName', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.variant = 'success';
    expect(component.variantClass).toBe('bg-success-500');
    expect(component.iconName).toBe('check_circle');

    component.variant = 'error';
    expect(component.variantClass).toBe('bg-error-500');
    expect(component.iconName).toBe('close');

    component.variant = 'warning';
    expect(component.variantClass).toBe('bg-warning-500');
    expect(component.iconName).toBe('warning');
  });

  it('should fade out progressively according to stackIndex', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.stackOpacity).toBe(1);
    component.stackIndex = 1;
    expect(component.stackOpacity).toBeCloseTo(0.7);
    component.stackIndex = 2;
    expect(component.stackOpacity).toBeCloseTo(0.4);
    component.stackIndex = 10;
    expect(component.stackOpacity).toBe(0);
  });

  it('should clear the hide timer on ngOnDestroy without throwing', () => {
    vi.useFakeTimers();
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.visible = true;
    fixture.detectChanges();

    expect(() => fixture.destroy()).not.toThrow();

    // No pending callback should attempt to run after destroy.
    expect(() => vi.advanceTimersByTime(component.time)).not.toThrow();
    vi.useRealTimers();
  });
});
