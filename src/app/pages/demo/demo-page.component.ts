import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

/** Pagina generica para las rutas `demo/:slug` del menu demo. Reemplazala por vitrinas
 * reales de los componentes de db-ui-kit a medida que las vayas armando. */
@Component({
  selector: 'app-demo-page',
  imports: [AsyncPipe],
  template: `
    <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h1 class="text-title-sm font-semibold capitalize text-gray-800 dark:text-white/90">
        {{ slug$ | async }}
      </h1>
      <p class="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">Pagina demo.</p>
    </div>
  `,
})
export class DemoPageComponent {
  protected readonly slug$ = inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('slug')));
}
