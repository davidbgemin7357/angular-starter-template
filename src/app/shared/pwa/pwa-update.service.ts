import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/** Cada cuánto se pregunta al servidor si hay una versión nueva mientras la app está abierta. */
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

/** Avisa cuando el service worker descargó una versión nueva de la app. Sin esto, una app
 * instalada seguiría mostrando la versión en caché hasta que se cierre por completo. */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly document = inject(DOCUMENT);

  public readonly updateAvailable = signal(false);

  constructor() {
    // En `ng serve` el service worker está desactivado: no hay nada que vigilar.
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => this.updateAvailable.set(true));

    // Si el caché quedó inservible (p. ej. se borró un archivo en el servidor), recargar.
    this.swUpdate.unrecoverable.subscribe(() => this.document.location.reload());

    setInterval(() => void this.swUpdate.checkForUpdate().catch(() => undefined), CHECK_INTERVAL_MS);
  }

  /** Activa la versión nueva y recarga la página. */
  public async applyUpdate(): Promise<void> {
    await this.swUpdate.activateUpdate();
    this.document.location.reload();
  }

  public dismiss(): void {
    this.updateAvailable.set(false);
  }
}
