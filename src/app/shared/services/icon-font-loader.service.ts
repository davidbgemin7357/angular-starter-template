import { Injectable } from '@angular/core';

/** Evita el flash de nombres de ícono crudos (ej. "user", "user_attributes") en el sidenav,
 * que ocurre cuando la navegación post-login ocurre antes de que la fuente
 * Material Symbols Outlined termine de descargarse. */
@Injectable({ providedIn: 'root' })
export class IconFontLoaderService {
  private readonly TIMEOUT_MS = 2000;

  waitForIconFont(): Promise<void> {
    if (typeof document === 'undefined' || !('fonts' in document)) {
      return Promise.resolve();
    }

    const fontsLoaded = Promise.all([
      document.fonts.load('400 24px "Material Symbols Outlined"'),
      document.fonts.ready,
    ]).then(() => undefined);

    const timeout = new Promise<void>((resolve) => setTimeout(resolve, this.TIMEOUT_MS));

    return Promise.race([fontsLoaded, timeout]);
  }
}
