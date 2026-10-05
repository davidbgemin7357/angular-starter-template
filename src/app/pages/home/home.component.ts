import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [AsyncPipe],
  template: `
    <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h1 class="text-title-sm font-semibold text-gray-800 dark:text-white/90">
        Bienvenido, {{ (authService.userData$ | async)?.vNombres }}
      </h1>
      <p class="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
        Espacio de trabajo para mejorar db-ui-kit y el layout base (sidebar, navbar y login).
      </p>
    </div>
  `,
})
export class HomeComponent {
  protected readonly authService = inject(AuthService);
}
