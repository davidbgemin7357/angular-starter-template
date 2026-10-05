import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DbRadioComponent } from './db-radio.component';
import { DbRadioRegistry } from './db-radio.registry';

describe('DbRadioComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbRadioComponent],
    }).compileComponents();
  });

  function createComponent(): DbRadioComponent {
    const fixture = TestBed.createComponent(DbRadioComponent);
    const component = fixture.componentInstance;
    component.id = 'opt-1';
    component.name = 'group-1';
    component.value = 'opt-1';
    component.label = 'Opción 1';
    fixture.detectChanges();
    return component;
  }

  it('debería crearse', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
  });

  it('writeValue marca checked=true cuando el value coincide con el @Input value', () => {
    const component = createComponent();
    component.writeValue('opt-1');
    expect(component.checked).toBe(true);
  });

  it('writeValue marca checked=false cuando el value NO coincide con el @Input value', () => {
    const component = createComponent();
    component.writeValue('otro-valor');
    expect(component.checked).toBe(false);
  });

  it('onChange invoca registerOnChange, registerOnTouched y emite valueChange cuando no está deshabilitado', () => {
    const component = createComponent();
    const onChangeSpy = vi.fn();
    const onTouchedSpy = vi.fn();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    component.onChange();

    expect(component.checked).toBe(true);
    expect(onChangeSpy).toHaveBeenCalledWith('opt-1');
    expect(onTouchedSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('opt-1');
  });

  it('onChange no hace nada si el radio está deshabilitado', () => {
    const component = createComponent();
    const onChangeSpy = vi.fn();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.registerOnChange(onChangeSpy);
    component.disabled = true;

    component.onChange();

    expect(component.checked).toBe(false);
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('setDisabledState actualiza la propiedad disabled', () => {
    const component = createComponent();
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });
});

@Component({
  imports: [ReactiveFormsModule, DbRadioComponent],
  template: `
    <form [formGroup]="form">
      <db-radio id="r-a" name="grupo" value="A" label="A" formControlName="choice"></db-radio>
      <db-radio id="r-b" name="grupo" value="B" label="B" formControlName="choice"></db-radio>
      <db-radio id="r-c" name="grupo" value="C" label="C" formControlName="choice"></db-radio>
    </form>
  `,
})
class RadioGroupHostComponent {
  form = new FormGroup({ choice: new FormControl<string | null>(null) });
}

describe('DbRadioComponent en grupo con formControlName', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioGroupHostComponent],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(RadioGroupHostComponent);
    fixture.detectChanges();
    const debugRadios = fixture.debugElement.queryAll(By.directive(DbRadioComponent));
    const radios = debugRadios.map((d) => d.componentInstance as DbRadioComponent);
    const inputs = debugRadios.map((d) => d.nativeElement.querySelector('input') as HTMLInputElement);
    const dotVisible = (i: number): boolean => {
      const dot = debugRadios[i].nativeElement.querySelector('span > span') as HTMLElement;
      return dot.classList.contains('block') && !dot.classList.contains('hidden');
    };
    const click = (i: number) => {
      inputs[i].click();
      fixture.detectChanges();
    };
    return { fixture, radios, inputs, dotVisible, click };
  }

  it('al seleccionar B después de A, solo B queda marcado', () => {
    const { fixture, radios, dotVisible, click } = setup();

    click(0);
    expect(radios.map((r) => r.checked)).toEqual([true, false, false]);

    click(1);
    expect(fixture.componentInstance.form.value.choice).toBe('B');
    expect(radios.map((r) => r.checked)).toEqual([false, true, false]);
    expect([0, 1, 2].map(dotVisible)).toEqual([false, true, false]);
  });

  it('control.setValue("C") marca solo C', () => {
    const { fixture, radios, dotVisible, click } = setup();
    click(0);

    fixture.componentInstance.form.controls.choice.setValue('C');
    fixture.detectChanges();

    expect(radios.map((r) => r.checked)).toEqual([false, false, true]);
    expect([0, 1, 2].map(dotVisible)).toEqual([false, false, true]);
  });

  it('blur del input nativo marca el control como touched', () => {
    const { fixture, inputs } = setup();
    const control = fixture.componentInstance.form.controls.choice;
    expect(control.touched).toBe(false);

    inputs[1].dispatchEvent(new Event('blur'));

    expect(control.touched).toBe(true);
  });

  it('al destruirse, el radio se desregistra del registro', () => {
    const { fixture, radios } = setup();
    const registry = TestBed.inject(DbRadioRegistry);
    const spy = vi.spyOn(registry, 'unregister');
    fixture.destroy();
    expect(spy).toHaveBeenCalledTimes(radios.length);
  });
});
