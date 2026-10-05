import { Component, signal } from '@angular/core';
import { DbButtonComponent, DbComponentCardComponent, DbModalComponent } from 'db-ui-kit';

type ModalKey = 'normal' | 'fullscreen' | 'sinCerrar' | 'sinClickFuera';

/** Vitrina de db-modal: modal con contenido proyectado y titulo, pantalla completa, sin boton
 * de cierre y sin cierre por click fuera / Escape. */
@Component({
  selector: 'app-modal-demo',
  imports: [DbModalComponent, DbButtonComponent, DbComponentCardComponent],
  templateUrl: './modal-demo.component.html',
  styles: ``,
})
export class ModalDemoComponent {
  public openModal = signal<ModalKey | null>(null);
  public lastEvent = signal('ninguno');

  public open(key: ModalKey): void {
    this.openModal.set(key);
    this.lastEvent.set(`abierto: ${key}`);
  }

  public handleClose(key: ModalKey, origen: string): void {
    this.openModal.set(null);
    this.lastEvent.set(`${origen} en "${key}"`);
  }
}
