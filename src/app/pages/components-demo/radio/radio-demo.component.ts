import { Component, signal } from '@angular/core';
import { DbComponentCardComponent, DbRadioComponent } from 'db-ui-kit';

interface RadioDemoOption {
  id: string;
  value: string;
  label: string;
}

/** Vitrina de db-radio: grupo que comparte `name`, opción pre-marcada y deshabilitado. */
@Component({
  selector: 'app-radio-demo',
  imports: [DbComponentCardComponent, DbRadioComponent],
  templateUrl: './radio-demo.component.html',
  styles: ``,
})
export class RadioDemoComponent {
  public lastEvent = signal('Ninguno');
  public selectedPlan = signal('');
  public selectedShipping = signal('express');

  public readonly planOptions: RadioDemoOption[] = [
    { id: 'radio-plan-basic', value: 'basic', label: 'Plan básico' },
    { id: 'radio-plan-pro', value: 'pro', label: 'Plan profesional' },
    { id: 'radio-plan-enterprise', value: 'enterprise', label: 'Plan empresarial' },
  ];

  public readonly shippingOptions: RadioDemoOption[] = [
    { id: 'radio-ship-standard', value: 'standard', label: 'Envío estándar' },
    { id: 'radio-ship-express', value: 'express', label: 'Envío express (pre-marcado)' },
  ];

  public onPlanChange(value: string): void {
    this.selectedPlan.set(value);
    this.lastEvent.set(`Plan → valueChange: "${value}"`);
  }

  public onShippingChange(value: string): void {
    this.selectedShipping.set(value);
    this.lastEvent.set(`Envío → valueChange: "${value}"`);
  }
}
