import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // restaura la sesion guardada (ver AuthService.refresh) antes de que el router evalue
    // los guards — sin esto, cada recarga de pagina se veria como "no logueado".
    provideAppInitializer(() => firstValueFrom(inject(AuthService).refresh())),
    // PWA: el service worker solo se registra en builds de producción (en `ng serve` no hay
    // ngsw-worker.js). Espera a que la app esté estable (o 30 s) para no competir con la
    // carga inicial. Ver la sección "PWA" del README.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
