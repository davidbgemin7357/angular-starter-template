import { Component, signal } from '@angular/core';
import {
  DbButtonComponent,
  DbComponentCardComponent,
  DbTextBoxComponent,
  DbTooltipAnimation,
  DbTooltipComponent,
  DbTooltipPosition,
} from 'db-ui-kit-angular';

/** Vitrina de db-tooltip: texto simple, plantilla rica, animaciones, posiciones, eventos de
 * apertura, retardos y modo controlado. */
@Component({
  selector: 'app-tooltip-demo',
  imports: [DbComponentCardComponent, DbTooltipComponent, DbButtonComponent, DbTextBoxComponent],
  templateUrl: './tooltip-demo.component.html',
  styles: ``,
})
export class TooltipDemoComponent {
  public lastEvent = signal('Ninguno');
  public controlledVisible = signal(false);

  public readonly remoteImage = 'https://picsum.photos/id/0/320/200';
  public readonly tvImage = 'https://picsum.photos/id/180/480/320';

  public readonly animations: DbTooltipAnimation[] = ['fade', 'pop', 'none'];
  public readonly positions: DbTooltipPosition[] = ['top', 'bottom', 'left', 'right'];

  public toggleControlled(): void {
    this.controlledVisible.update((visible) => !visible);
  }

  public handleVisibleChange(visible: boolean): void {
    this.controlledVisible.set(visible);
    this.lastEvent.set(`visibleChange: ${visible}`);
  }

  public logEvent(name: string): void {
    this.lastEvent.set(name);
  }
}
