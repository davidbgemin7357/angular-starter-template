import { Component, inject } from '@angular/core';
import { DbButtonComponent } from 'db-ui-kit';
import { PwaInstallService } from './pwa-install.service';
import { PwaUpdateService } from './pwa-update.service';

/** Aviso inferior de la PWA: "hay una versión nueva" tiene prioridad sobre "instalar la app".
 * Se monta una sola vez en el componente raíz (app.html). */
@Component({
  selector: 'app-pwa-prompt',
  imports: [DbButtonComponent],
  templateUrl: './pwa-prompt.component.html',
})
export class PwaPromptComponent {
  protected readonly installService = inject(PwaInstallService);
  protected readonly updateService = inject(PwaUpdateService);

  protected install(): void {
    void this.installService.install();
  }

  protected reload(): void {
    void this.updateService.applyUpdate();
  }
}
