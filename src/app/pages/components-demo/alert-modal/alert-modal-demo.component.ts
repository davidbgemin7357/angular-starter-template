import { Component, signal } from '@angular/core';
import { AlertModalMode, DbAlertModalComponent, DbButtonComponent, DbComponentCardComponent, Variant } from 'db-ui-kit';

interface AlertExample {
  mode: AlertModalMode;
  label: string;
  message: string;
  buttonVariant: Variant;
}

/** Vitrina de db-alert-modal: modos success, warning y danger, con y sin titulo. */
@Component({
  selector: 'app-alert-modal-demo',
  imports: [DbAlertModalComponent, DbButtonComponent, DbComponentCardComponent],
  templateUrl: './alert-modal-demo.component.html',
  styles: ``,
})
export class AlertModalDemoComponent {
  public readonly examples: AlertExample[] = [
    { mode: 'success', label: 'Éxito', message: 'El registro se guardó correctamente.', buttonVariant: 'success' },
    { mode: 'warning', label: 'Advertencia', message: 'Hay campos incompletos que conviene revisar.', buttonVariant: 'warning' },
    { mode: 'danger', label: 'Error', message: 'No se pudo completar la operación. Inténtalo nuevamente.', buttonVariant: 'error' },
  ];

  public isOpen = signal(false);
  public currentMode = signal<AlertModalMode>('success');
  public currentMessage = signal('');
  public currentTitle = signal<string | undefined>(undefined);
  public lastEvent = signal('ninguno');

  public open(example: AlertExample, withTitle: boolean): void {
    this.currentMode.set(example.mode);
    this.currentMessage.set(example.message);
    this.currentTitle.set(withTitle ? example.label : undefined);
    this.isOpen.set(true);
    this.lastEvent.set(`abierto en modo ${example.mode}`);
  }

  public handleAccept(): void {
    this.isOpen.set(false);
    this.lastEvent.set(`accept (modo ${this.currentMode()})`);
  }

  public handleClose(): void {
    this.isOpen.set(false);
    this.lastEvent.set(`close (modo ${this.currentMode()})`);
  }
}
