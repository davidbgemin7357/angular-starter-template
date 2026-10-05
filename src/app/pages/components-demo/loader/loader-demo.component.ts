import { Component, OnDestroy, signal } from '@angular/core';
import { DbButtonComponent, DbComponentCardComponent, DbLoaderComponent } from 'db-ui-kit-angular';

const LOADER_DURATION_MS = 2000;

/** Vitrina de db-loader: overlay de carga a pantalla completa controlado con isVisible. */
@Component({
  selector: 'app-loader-demo',
  imports: [DbLoaderComponent, DbButtonComponent, DbComponentCardComponent],
  templateUrl: './loader-demo.component.html',
  styles: ``,
})
export class LoaderDemoComponent implements OnDestroy {
  public isLoading = signal(false);
  public lastEvent = signal('ninguno');
  public readonly durationMs: number = LOADER_DURATION_MS;

  private timeoutId?: ReturnType<typeof setTimeout>;

  public showLoader(): void {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.lastEvent.set('loader visible');
    this.timeoutId = setTimeout(() => {
      this.isLoading.set(false);
      this.lastEvent.set(`loader oculto tras ${LOADER_DURATION_MS} ms`);
    }, LOADER_DURATION_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeoutId);
  }
}
