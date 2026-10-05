import { DbTooltipPosition } from './db-tooltip.types';

/** Resultado del cálculo de posición: coordenadas fixed (viewport) y lado real usado. */
export interface DbTooltipPlacement {
  top: number;
  left: number;
  side: DbTooltipPosition;
  /** Desplazamiento de la flecha dentro del tooltip (px), para que apunte al centro del target. */
  arrowOffset: number;
}
