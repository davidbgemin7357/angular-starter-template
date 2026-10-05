// Bloqueo del scroll de la página compartido entre todos los modales. Lleva la cuenta de
// cuántos lo han pedido para que, con modales apilados (ej. un confirm sobre un db-modal),
// cerrar el de arriba no reactive el scroll mientras el de abajo sigue abierto.
let locks = 0;

export function lockBodyScroll(): void {
  if (locks++ === 0) {
    document.body.style.overflow = 'hidden';
  }
}

export function unlockBodyScroll(): void {
  if (locks > 0 && --locks === 0) {
    document.body.style.overflow = '';
  }
}

/** Solo para tests: reinicia el contador. */
export function resetBodyScrollLock(): void {
  locks = 0;
  document.body.style.overflow = '';
}
