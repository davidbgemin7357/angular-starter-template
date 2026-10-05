import { Component, signal } from '@angular/core';
import { DbComponentCardComponent, DbSwitchComponent } from 'db-ui-kit-angular';

/** Vitrina de db-switch: colores blue/gray, estado inicial y deshabilitado. */
@Component({
  selector: 'app-switch-demo',
  imports: [DbComponentCardComponent, DbSwitchComponent],
  templateUrl: './switch-demo.component.html',
  styles: ``,
})
export class SwitchDemoComponent {
  public lastEvent = signal('Ninguno');
  public notificationsEnabled = signal(true);

  public onValueChange(source: string, value: boolean): void {
    this.lastEvent.set(`${source} → valueChange: ${value}`);
  }

  public onNotificationsChange(value: boolean): void {
    this.notificationsEnabled.set(value);
    this.onValueChange('Notificaciones', value);
  }
}
