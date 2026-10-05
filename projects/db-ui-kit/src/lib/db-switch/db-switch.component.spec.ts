import { TestBed } from '@angular/core/testing';
import { DbSwitchComponent } from './db-switch.component';

describe('DbSwitchComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbSwitchComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the label text and an unchecked switch input by default', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.componentInstance.label = 'Activar notificaciones';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.checked).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Activar notificaciones');
  });

  it('should apply the brand background class when checked with the default blue color', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.componentInstance.isChecked = true;
    fixture.detectChanges();
    const backgroundSpan = fixture.nativeElement.querySelector('span > span') as HTMLSpanElement;
    expect(backgroundSpan.classList.contains('bg-brand-500')).toBe(true);
  });

  it('should apply the gray-800 background class when checked with the gray color', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.componentInstance.color = 'gray';
    fixture.componentInstance.isChecked = true;
    fixture.detectChanges();
    const backgroundSpan = fixture.nativeElement.querySelector('span > span') as HTMLSpanElement;
    expect(backgroundSpan.classList.contains('bg-gray-800')).toBe(true);
  });

  it('should apply a solid gray background when checked and disabled, distinct from unchecked and disabled', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.componentInstance.disabled = true;
    fixture.componentInstance.isChecked = true;
    fixture.detectChanges();
    const backgroundSpan = fixture.nativeElement.querySelector('span > span') as HTMLSpanElement;
    expect(backgroundSpan.classList.contains('bg-gray-400')).toBe(true);

    fixture.componentInstance.isChecked = false;
    fixture.changeDetectorRef.detectChanges();
    expect(backgroundSpan.classList.contains('bg-gray-100')).toBe(true);
    expect(backgroundSpan.classList.contains('bg-gray-400')).toBe(false);
  });

  it('should emit valueChange with the toggled value when the checkbox input changes', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.detectChanges();
    let received: boolean | undefined;
    fixture.componentInstance.valueChange.subscribe((value: boolean) => {
      received = value;
    });
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(received).toBe(true);
    expect(fixture.componentInstance.isChecked).toBe(true);
  });

  it('should not emit valueChange or change state when disabled', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.valueChange.subscribe(spy);
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);

    input.checked = true;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(spy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.isChecked).toBe(false);
  });

  it('should update the internal isChecked state via the ControlValueAccessor writeValue method', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.detectChanges();
    fixture.componentInstance.writeValue(true);
    expect(fixture.componentInstance.isChecked).toBe(true);
    fixture.componentInstance.writeValue(false);
    expect(fixture.componentInstance.isChecked).toBe(false);
  });

  it('should invoke the registered onChange and onTouched callbacks when the input changes', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.detectChanges();
    const onChangeSpy = vi.fn();
    const onTouchedSpy = vi.fn();
    fixture.componentInstance.registerOnChange(onChangeSpy);
    fixture.componentInstance.registerOnTouched(onTouchedSpy);

    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(onChangeSpy).toHaveBeenCalledWith(true);
    expect(onTouchedSpy).toHaveBeenCalledTimes(1);
  });

  it('should update the disabled state via setDisabledState', () => {
    const fixture = TestBed.createComponent(DbSwitchComponent);
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.disabled).toBe(true);
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
