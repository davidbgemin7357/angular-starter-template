import { TestBed } from '@angular/core/testing';
import { DbMultiSelectComponent } from './db-multi-select.component';
import { Option } from './db-multi-select.interface';

describe('DbMultiSelectComponent', () => {
  const options: Option[] = [
    { code: 1, text: 'Opción 1' },
    { code: 2, text: 'Opción 2' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbMultiSelectComponent],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(DbMultiSelectComponent);
    fixture.componentInstance.options = options;
    fixture.detectChanges();
    return fixture;
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not open the dropdown when disabled', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.disabled = true;

    component.toggleDropdown();

    expect(component.isOpen).toBe(false);
  });

  it('should select an option via DOM click, rendering a chip and emitting selectionChange/valueChange', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const selectionChangeSpy = vi.fn();
    const valueChangeSpy = vi.fn();
    component.selectionChange.subscribe(selectionChangeSpy);
    component.valueChange.subscribe(valueChangeSpy);

    const trigger = fixture.nativeElement.querySelector('.shadow-theme-xs') as HTMLDivElement;
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    const optionEls = fixture.nativeElement.querySelectorAll('.overflow-y-auto > div');
    (optionEls[0] as HTMLDivElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.selectedOptions).toEqual([1]);
    expect(selectionChangeSpy).toHaveBeenCalledWith([1]);
    expect(valueChangeSpy).toHaveBeenCalledWith([options[0]]);

    const chipText = fixture.nativeElement.querySelector('.rounded-full span');
    expect(chipText?.textContent?.trim()).toBe('Opción 1');
  });

  it('should remove a selected option when handleSelect toggles it off', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.handleSelect(1);
    component.handleSelect(2);

    component.handleSelect(1);

    expect(component.selectedOptions).toEqual([2]);
  });

  it('should remove an option via removeOption and notify the form control', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    component.handleSelect(1);
    component.handleSelect(2);

    component.removeOption(1);

    expect(component.selectedOptions).toEqual([2]);
    expect(onChangeSpy).toHaveBeenCalledWith([2]);
  });

  it('should not remove an option via removeOption when disabled', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.handleSelect(1);
    component.handleSelect(2);
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    component.setDisabledState(true);

    component.removeOption(1);

    expect(component.selectedOptions).toEqual([1, 2]);
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it('should clear all selections via clearAll and stop event propagation', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const onTouchedSpy = vi.fn();
    component.registerOnTouched(onTouchedSpy);
    component.handleSelect(1);
    component.handleSelect(2);
    const stopPropagationSpy = vi.fn();

    component.clearAll({ stopPropagation: stopPropagationSpy } as unknown as Event);

    expect(component.selectedOptions).toEqual([]);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('should implement ControlValueAccessor writeValue and setDisabledState', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.writeValue([2]);
    expect(component.selectedOptions).toEqual([2]);
    expect(component.isOptionSelected(2)).toBe(true);

    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('should fall back to writeValue([]) when value is null/undefined', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.writeValue(null as unknown as (number | string)[]);

    expect(component.selectedOptions).toEqual([]);
  });
});
