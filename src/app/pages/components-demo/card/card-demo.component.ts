import { Component, signal } from '@angular/core';
import { DbBadgeComponent, DbButtonComponent, DbComponentCardComponent } from 'db-ui-kit-angular';

/** Vitrina de db-card: solo titulo, con descripcion, con acciones en la cabecera
 * (slot [cardActions]) y con clases extra via className. */
@Component({
  selector: 'app-card-demo',
  imports: [DbComponentCardComponent, DbButtonComponent, DbBadgeComponent],
  templateUrl: './card-demo.component.html',
})
export class CardDemoComponent {
  public lastEvent = signal('ninguno');

  public handleAction(action: string): void {
    this.lastEvent.set(`Acción de cabecera: ${action}`);
  }
}
