export const GENERIC_ERROR_MESSAGE =
  'Algo salió mal. Por favor, vuelve a intentarlo en unos minutos.';

/**
 * UUID v4 para las claves de idempotencia.
 *
 * `crypto.randomUUID` solo existe en contextos seguros (https, localhost o 127.0.0.1), asi que
 * desde otro equipo de la red —donde la app se sirve por http— el navegador no la expone. En
 * ese caso se construye con `getRandomValues`, que si esta disponible sin contexto seguro.
 * El backend valida el campo con @IsUUID(), de modo que el formato tiene que ser correcto.
 */
export function generarUuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
