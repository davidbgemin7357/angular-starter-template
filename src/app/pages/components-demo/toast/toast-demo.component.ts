import { Component, inject, signal } from '@angular/core';
import { DbButtonComponent, DbComponentCardComponent, DbToastComponent, DbToastService, ToastVariant, Variant } from 'db-ui-kit';

interface ToastExample {
  variant: ToastVariant;
  label: string;
  message: string;
  buttonVariant: Variant;
}

/** Vitrina de db-toast: las cinco variantes lanzadas con DbToastService.open() y un
 * <db-toast> declarado en la plantilla con duracion propia y visible controlado por signal. */
@Component({
  selector: 'app-toast-demo',
  imports: [DbToastComponent, DbButtonComponent, DbComponentCardComponent],
  templateUrl: './toast-demo.component.html',
  styles: ``,
})
export class ToastDemoComponent {
  private readonly toastService = inject(DbToastService);

  public readonly examples: ToastExample[] = [
    { variant: 'success', label: 'Success', message: 'Cambios guardados correctamente.', buttonVariant: 'success' },
    { variant: 'error', label: 'Error', message: 'No se pudo conectar con el servidor.', buttonVariant: 'error' },
    { variant: 'warning', label: 'Warning', message: 'La sesión expirará en 5 minutos.', buttonVariant: 'warning' },
    { variant: 'primary', label: 'Primary', message: 'Hay una nueva versión disponible.', buttonVariant: 'primary' },
    { variant: 'info', label: 'Info', message: 'Sincronización en segundo plano.', buttonVariant: 'primary' },
  ];

  public readonly customTime: number = 6000;
  public lastEvent = signal('ninguno');
  public toastVisible = signal(false);

  public openToast(example: ToastExample): void {
    this.toastService.open(example.variant, example.message);
    this.lastEvent.set(`open('${example.variant}') con duración por defecto de 4000 ms`);
  }

  public openShortToast(): void {
    this.toastService.open('info', 'Este toast dura solo 1.5 segundos.', 1500);
    this.lastEvent.set(`open('info', ..., 1500)`);
  }

  public toggleToast(): void {
    this.toastVisible.update((visible) => !visible);
    this.lastEvent.set(`visible → ${this.toastVisible()}`);
  }

  // El toast se oculta solo al cumplirse `time`; se sincroniza el signal para que el siguiente
  // click en "Mostrar" vuelva a mandar true (sin esto el input no cambiaria).
  // Solo se registra cuando el toast se oculto por tiempo: closed tambien se emite al arrancar
  // (visible inicial en false) y al ocultarlo a mano.
  public handleClosed(): void {
    if (!this.toastVisible()) return;

    this.toastVisible.set(false);
    this.lastEvent.set(`closed (se ocultó tras ${this.customTime} ms)`);
  }
}
