import { TestBed } from '@angular/core/testing';
import { DbSelectBoxComponent } from './db-selectbox.component';
import { Option } from './db-selectbox.interface';

describe('DbSelectBoxComponent', () => {
  const options: Option[] = [
    { code: 1, name: 'Opción 1' },
    { code: 2, name: 'Opción 2', active: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbSelectBoxComponent],
    }).compileComponents();
  });

  function createComponent(configure?: (instance: DbSelectBoxComponent) => void) {
    const fixture = TestBed.createComponent(DbSelectBoxComponent);
    fixture.componentInstance.options = options;
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the placeholder when there is no value selected', () => {
    const fixture = createComponent((instance) => {
      instance.placeholder = 'Selecciona algo';
    });
    const button = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    expect(button.textContent).toContain('Selecciona algo');
  });

  it('should open the dropdown and select an active option, emitting valueChange and optionSelected', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const valueChangeSpy = vi.fn();
    const optionSelectedSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);
    component.optionSelected.subscribe(optionSelectedSpy);

    const button = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.isOpen).toBe(true);

    const optionEls = fixture.nativeElement.querySelectorAll('li[role="option"]');
    // first li is the "clear" placeholder option, the active option is the second li
    const activeOptionEl = optionEls[1] as HTMLLIElement;
    activeOptionEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.value).toBe('1');
    expect(valueChangeSpy).toHaveBeenCalledWith('1');
    expect(optionSelectedSpy).toHaveBeenCalledWith(1);
    expect(component.isOpen).toBe(false);
  });

  it('should not select an inactive option', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const button = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    const optionEls = fixture.nativeElement.querySelectorAll('li[role="option"]');
    const inactiveOptionEl = optionEls[2] as HTMLLIElement;
    inactiveOptionEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.value).toBe('');
  });

  it('should implement ControlValueAccessor writeValue/registerOnChange/registerOnTouched', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const onChangeSpy = vi.fn();
    const onTouchedSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    component.writeValue('2');
    expect(component.value).toBe('2');

    component.selectOption(options[0]);
    expect(onChangeSpy).toHaveBeenCalledWith('1');
    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('should disable the component through setDisabledState and prevent opening the dropdown', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.toggleDropdown();
    expect(component.isOpen).toBe(false);
  });

  it('should clear the value when clearValue is invoked', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.writeValue('1');
    const valueChangeSpy = vi.fn();
    const optionSelectedSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);
    component.optionSelected.subscribe(optionSelectedSpy);

    const stopPropagationSpy = vi.fn();
    component.clearValue({ stopPropagation: stopPropagationSpy } as unknown as Event);

    expect(component.value).toBe('');
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(valueChangeSpy).toHaveBeenCalledWith('');
    expect(optionSelectedSpy).toHaveBeenCalledWith('');
  });

  it('should reconcile the value on ngOnChanges (reset when inactive, apply defaultValue when empty)', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.value = '2';
    component.ngOnChanges();
    expect(component.value).toBe('');

    component.defaultValue = '1';
    component.ngOnChanges();
    expect(component.value).toBe('1');
  });
});
