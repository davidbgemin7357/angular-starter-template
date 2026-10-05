import { TestBed } from '@angular/core/testing';
import { DbCheckboxComponent } from './db-checkbox.component';

describe('DbCheckboxComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbCheckboxComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DbCheckboxComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the label and text inputs', () => {
    const fixture = TestBed.createComponent(DbCheckboxComponent);
    fixture.componentInstance.label = 'Etiqueta';
    fixture.componentInstance.text = 'Texto adicional';
    fixture.detectChanges();
    const spans = fixture.nativeElement.querySelectorAll('span');
    const textContent = Array.from(spans as NodeListOf<HTMLSpanElement>).map((span) => span.textContent?.trim());
    expect(textContent).toContain('Etiqueta');
    expect(textContent).toContain('Texto adicional');
  });

  it('should sanitize htmlContent: keeps formatting tags and strips event handlers', () => {
    const fixture = TestBed.createComponent(DbCheckboxComponent);
    fixture.componentRef.setInput('htmlContent', 'Acepto <strong>términos</strong><img src="x" onerror="alert(1)">');
    fixture.detectChanges();

    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(fixture.nativeElement.querySelector('strong')?.textContent).toBe('términos');
    expect(html).not.toContain('onerror');
  });

  it('should reflect the checked input on the native input element', () => {
    const fixture = TestBed.createComponent(DbCheckboxComponent);
    fixture.componentInstance.checked = true;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.checked).toBe(true);
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
  });

  it('should apply the disabled styles and prevent the checked state from changing on interaction', () => {
    const fixture = TestBed.createComponent(DbCheckboxComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.classList.contains('cursor-not-allowed')).toBe(true);

    const spy = vi.fn();
    fixture.componentInstance.valueChange.subscribe(spy);
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(spy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.checked).toBe(false);
  });

  it('should emit valueChange with the new checked value when the input changes', () => {
    const fixture = TestBed.createComponent(DbCheckboxComponent);
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
    expect(fixture.componentInstance.checked).toBe(true);
  });

  it('should update the internal checked state via the ControlValueAccessor writeValue method', () => {
    const fixture = TestBed.createComponent(DbCheckboxComponent);
    fixture.detectChanges();
    fixture.componentInstance.writeValue(true);
    expect(fixture.componentInstance.checked).toBe(true);
    fixture.componentInstance.writeValue(false);
    expect(fixture.componentInstance.checked).toBe(false);
  });

  it('should invoke the registered onChange and onTouched callbacks when the input changes', () => {
    const fixture = TestBed.createComponent(DbCheckboxComponent);
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
    const fixture = TestBed.createComponent(DbCheckboxComponent);
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.disabled).toBe(true);
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
