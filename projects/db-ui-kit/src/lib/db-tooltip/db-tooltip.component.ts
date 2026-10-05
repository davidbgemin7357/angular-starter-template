import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { DbTooltipAnimation, DbTooltipPosition, DbTooltipShowEvent, DbTooltipTarget } from './db-tooltip.types';
import { DbTooltipPlacement } from './db-tooltip.interface';

/** Separación entre el target y el tooltip (incluye la flecha). */
const GAP_PX = 10;
/** Margen mínimo contra los bordes de la ventana. */
const VIEWPORT_MARGIN_PX = 8;
/** Con showEvent="mouseenter": tiempo para pasar el mouse del target al tooltip sin que se cierre. */
const HOVER_GRACE_MS = 100;
/** Duración de la animación de salida (debe coincidir con el .css). */
const LEAVE_ANIMATION_MS = 150;

const OPPOSITE: Record<DbTooltipPosition, DbTooltipPosition> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

let nextTooltipId = 0;

/** Tooltip asociado a un elemento "target", al estilo de dxTooltip de DevExtreme. El contenido
 * se proyecta (texto o cualquier plantilla). Mientras está visible se mueve a document.body con
 * position: fixed, así no lo recorta ningún overflow ni lo desplaza un ancestro con transform
 * (p. ej. el contenido animado de db-modal). */
@Component({
  selector: 'db-tooltip',
  imports: [CommonModule],
  templateUrl: './db-tooltip.component.html',
  styleUrl: './db-tooltip.component.css',
})
export class DbTooltipComponent implements AfterViewInit, AfterViewChecked, OnChanges, OnDestroy {
  @Input() target: DbTooltipTarget;
  @Input() showEvent: DbTooltipShowEvent = 'mouseenter';
  @Input() position: DbTooltipPosition = 'top';
  @Input() animation: DbTooltipAnimation = 'fade';
  @Input() showDelay: number = 0;
  @Input() hideDelay: number = 0;
  @Input() visible: boolean = false;
  @Input() hideOnOutsideClick: boolean = true;
  @Input() showArrow: boolean = true;
  @Input() maxWidth: string = '20rem';
  @Input() className: string = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() shown = new EventEmitter<void>();
  @Output() hidden = new EventEmitter<void>();

  @ViewChild('tooltipEl') private tooltipRef?: ElementRef<HTMLElement>;

  public readonly tooltipId = `db-tooltip-${nextTooltipId++}`;
  /** true mientras el nodo del tooltip existe en el DOM (incluye la animación de salida). */
  public isOpen = false;
  /** true cuando la animación de entrada terminó de aplicarse (clase is-visible). */
  public isVisibleState = false;
  public placement: DbTooltipPlacement = { top: 0, left: 0, side: 'top', arrowOffset: 0 };

  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly cdr = inject(ChangeDetectorRef);

  private targetEl: HTMLElement | null = null;
  private targetListeners: Array<() => void> = [];
  private globalListeners: Array<() => void> = [];
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private leaveTimer?: ReturnType<typeof setTimeout>;
  private viewReady = false;
  private pendingVisible: boolean | null = null;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.bindTarget();

    if (this.visible) {
      this.pendingVisible = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) return;

    if (changes['target'] || changes['showEvent']) {
      this.bindTarget();
    }

    if (changes['visible'] && !changes['visible'].isFirstChange()) {
      // Se aplica en ngAfterViewChecked: abrir/cerrar corre detectChanges propio, y hacerlo
      // en medio del chequeo de la plantilla del padre provoca NG0100 en su two-way binding.
      this.pendingVisible = this.visible;
    }

    if ((changes['position'] || changes['maxWidth']) && this.isOpen) {
      this.updatePosition();
    }
  }

  ngAfterViewChecked(): void {
    if (this.pendingVisible === null) return;

    const visible = this.pendingVisible;
    this.pendingVisible = null;

    if (visible) {
      this.open(false);
    } else {
      this.close(false);
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.unbindTarget();
    this.unbindGlobal();
    this.detachFromBody();
  }

  /** Muestra el tooltip (respeta showDelay). */
  public show(): void {
    this.scheduleShow(this.showDelay);
  }

  /** Oculta el tooltip (respeta hideDelay). */
  public hide(): void {
    this.scheduleHide(this.hideDelay);
  }

  public toggle(): void {
    if (this.isVisibleState || this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  public onTooltipMouseEnter(): void {
    if (this.showEvent === 'mouseenter') {
      clearTimeout(this.hideTimer);
    }
  }

  public onTooltipMouseLeave(): void {
    if (this.showEvent === 'mouseenter') {
      this.scheduleHide(Math.max(this.hideDelay, HOVER_GRACE_MS));
    }
  }

  get tooltipClasses(): string {
    return [
      'db-tooltip db-glass-panel fixed z-99999 rounded-lg border px-3 py-2 text-sm shadow-theme-lg',
      'bg-white border-gray-200 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90',
      `db-tooltip--${this.animation}`,
      `db-tooltip--${this.placement.side}`,
      this.isVisibleState ? 'is-visible' : '',
      this.className,
    ].join(' ');
  }

  get arrowClasses(): string {
    // Solo se pintan los dos bordes que quedan hacia afuera del tooltip.
    const borders: Record<DbTooltipPosition, string> = {
      top: 'border-r border-b',
      bottom: 'border-l border-t',
      left: 'border-t border-r',
      right: 'border-b border-l',
    };

    return `db-tooltip-arrow absolute h-2.5 w-2.5 rotate-45 bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700 ${
      borders[this.placement.side]
    }`;
  }

  get arrowStyle(): Record<string, string> {
    const offset = `${this.placement.arrowOffset}px`;

    switch (this.placement.side) {
      case 'top':
        return { bottom: '-6px', left: offset, marginLeft: '-5px' };
      case 'bottom':
        return { top: '-6px', left: offset, marginLeft: '-5px' };
      case 'left':
        return { right: '-6px', top: offset, marginTop: '-5px' };
      default:
        return { left: '-6px', top: offset, marginTop: '-5px' };
    }
  }

  // ---------------------------------------------------------------------------
  // Target y eventos
  // ---------------------------------------------------------------------------

  private resolveTarget(): HTMLElement | null {
    const target = this.target;

    if (!target) return null;
    if (typeof target === 'string') return this.document.querySelector<HTMLElement>(target);
    if (target instanceof HTMLElement) return target;
    return target.nativeElement ?? null;
  }

  private bindTarget(): void {
    this.unbindTarget();
    this.targetEl = this.resolveTarget();

    const el = this.targetEl;
    if (!el) return;

    const listen = (eventName: string, handler: (event: Event) => void) => {
      this.targetListeners.push(this.renderer.listen(el, eventName, handler));
    };

    switch (this.showEvent) {
      case 'click':
        listen('click', () => this.toggle());
        break;
      case 'focus':
        // focusin/focusout burbujean: funcionan aunque el target sea un contenedor del input.
        listen('focusin', () => this.show());
        listen('focusout', () => this.hide());
        break;
      default:
        listen('mouseenter', () => this.show());
        listen('mouseleave', () => this.scheduleHide(Math.max(this.hideDelay, HOVER_GRACE_MS)));
        break;
    }
  }

  private unbindTarget(): void {
    this.targetListeners.forEach((unlisten) => unlisten());
    this.targetListeners = [];
    this.targetEl?.removeAttribute('aria-describedby');
  }

  private bindGlobal(): void {
    this.unbindGlobal();

    this.globalListeners.push(
      this.renderer.listen(this.document, 'keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') this.close(true);
      }),
    );

    if (this.showEvent === 'click' && this.hideOnOutsideClick) {
      this.globalListeners.push(
        this.renderer.listen(this.document, 'click', (event: MouseEvent) => {
          const clicked = event.target as Node;
          const insideTarget = this.targetEl?.contains(clicked);
          const insideTooltip = this.tooltipRef?.nativeElement.contains(clicked);
          if (!insideTarget && !insideTooltip) this.close(true);
        }),
      );
    }

    const reposition = () => this.updatePosition();
    const view = this.document.defaultView;
    if (view) {
      // capture: también reposiciona al hacer scroll dentro de contenedores con overflow.
      view.addEventListener('scroll', reposition, true);
      view.addEventListener('resize', reposition);
      this.globalListeners.push(() => {
        view.removeEventListener('scroll', reposition, true);
        view.removeEventListener('resize', reposition);
      });
    }
  }

  private unbindGlobal(): void {
    this.globalListeners.forEach((unlisten) => unlisten());
    this.globalListeners = [];
  }

  // ---------------------------------------------------------------------------
  // Mostrar / ocultar
  // ---------------------------------------------------------------------------

  private scheduleShow(delay: number): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.showTimer);

    if (delay > 0) {
      this.showTimer = setTimeout(() => this.open(true), delay);
    } else {
      this.open(true);
    }
  }

  private scheduleHide(delay: number): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);

    if (delay > 0) {
      this.hideTimer = setTimeout(() => this.close(true), delay);
    } else {
      this.close(true);
    }
  }

  private open(emit: boolean): void {
    clearTimeout(this.leaveTimer);
    if (this.isVisibleState) return;

    this.isOpen = true;
    this.cdr.detectChanges();

    const el = this.tooltipRef?.nativeElement;
    if (!el) return;

    this.renderer.appendChild(this.document.body, el);
    this.updatePosition();
    this.targetEl?.setAttribute('aria-describedby', this.tooltipId);
    this.bindGlobal();

    // Forzar reflow para que la animación de entrada parta del estado inicial.
    void el.offsetWidth;
    this.isVisibleState = true;
    this.cdr.detectChanges();

    this.shown.emit();
    if (emit) this.visibleChange.emit(true);
  }

  private close(emit: boolean): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    if (!this.isOpen) return;

    const wasVisible = this.isVisibleState;
    this.isVisibleState = false;
    this.unbindGlobal();
    this.targetEl?.removeAttribute('aria-describedby');
    this.cdr.detectChanges();

    const finish = () => {
      this.isOpen = false;
      this.cdr.detectChanges();
    };

    if (this.animation === 'none') {
      finish();
    } else {
      this.leaveTimer = setTimeout(finish, LEAVE_ANIMATION_MS);
    }

    if (wasVisible) {
      this.hidden.emit();
      if (emit) this.visibleChange.emit(false);
    }
  }

  private detachFromBody(): void {
    this.tooltipRef?.nativeElement.remove();
  }

  private clearTimers(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    clearTimeout(this.leaveTimer);
  }

  // ---------------------------------------------------------------------------
  // Posición
  // ---------------------------------------------------------------------------

  private updatePosition(): void {
    const el = this.tooltipRef?.nativeElement;
    if (!el || !this.targetEl) return;

    const view = this.document.defaultView;
    const viewportWidth = view?.innerWidth ?? 0;
    const viewportHeight = view?.innerHeight ?? 0;
    const targetRect = this.targetEl.getBoundingClientRect();
    const width = el.offsetWidth;
    const height = el.offsetHeight;

    const fits = (side: DbTooltipPosition): boolean => {
      switch (side) {
        case 'top':
          return targetRect.top - height - GAP_PX >= VIEWPORT_MARGIN_PX;
        case 'bottom':
          return targetRect.bottom + height + GAP_PX <= viewportHeight - VIEWPORT_MARGIN_PX;
        case 'left':
          return targetRect.left - width - GAP_PX >= VIEWPORT_MARGIN_PX;
        default:
          return targetRect.right + width + GAP_PX <= viewportWidth - VIEWPORT_MARGIN_PX;
      }
    };

    const side = fits(this.position) || !fits(OPPOSITE[this.position]) ? this.position : OPPOSITE[this.position];
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

    let top: number;
    let left: number;
    let arrowOffset: number;

    if (side === 'top' || side === 'bottom') {
      const centerX = targetRect.left + targetRect.width / 2;
      left = clamp(centerX - width / 2, VIEWPORT_MARGIN_PX, viewportWidth - width - VIEWPORT_MARGIN_PX);
      top = side === 'top' ? targetRect.top - height - GAP_PX : targetRect.bottom + GAP_PX;
      arrowOffset = clamp(centerX - left, 12, width - 12);
    } else {
      const centerY = targetRect.top + targetRect.height / 2;
      top = clamp(centerY - height / 2, VIEWPORT_MARGIN_PX, viewportHeight - height - VIEWPORT_MARGIN_PX);
      left = side === 'left' ? targetRect.left - width - GAP_PX : targetRect.right + GAP_PX;
      arrowOffset = clamp(centerY - top, 12, height - 12);
    }

    this.placement = { top, left, side, arrowOffset };
    this.cdr.detectChanges();
  }
}
