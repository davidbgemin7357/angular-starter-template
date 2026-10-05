import { Component, inject, signal } from '@angular/core';
import {
  DbButtonComponent,
  DbComponentCardComponent,
  DbConfirmModalComponent,
  DbConfirmModalOptions,
  DbConfirmModalService,
} from 'db-ui-kit-angular';

/** Vitrina de db-confirm-modal: uso declarativo con el output confirm y uso imperativo con
 * DbConfirmModalService.confirm(), que devuelve una Promise<boolean>. */
@Component({
  selector: 'app-confirm-modal-demo',
  imports: [DbConfirmModalComponent, DbButtonComponent, DbComponentCardComponent],
  templateUrl: './confirm-modal-demo.component.html',
  styles: ``,
})
export class ConfirmModalDemoComponent {
  private readonly confirmModalService = inject(DbConfirmModalService);

  public isOpen = signal(false);
  public lastEvent = signal('ninguno');
  public serviceResult = signal('ninguno');

  public handleConfirm(result: boolean): void {
    this.isOpen.set(false);
    this.lastEvent.set(`confirm → ${result ? 'Confirmado (true)' : 'Cancelado (false)'}`);
  }

  public handleClose(): void {
    this.isOpen.set(false);
    this.lastEvent.set('close (X, click fuera o Escape)');
  }

  public async confirmSimple(): Promise<void> {
    const result = await this.confirmModalService.confirm('¿Deseas eliminar este registro?');
    this.serviceResult.set(`confirm() simple → ${result}`);
  }

  public async confirmWithOptions(): Promise<void> {
    const options: DbConfirmModalOptions = {
      title: 'Enviar orden',
      hideOnOutsideClick: false,
      showCloseButton: false,
    };
    const result = await this.confirmModalService.confirm('Se enviará la orden al proveedor. ¿Continuar?', options);
    this.serviceResult.set(`confirm() con opciones → ${result}`);
  }
}
