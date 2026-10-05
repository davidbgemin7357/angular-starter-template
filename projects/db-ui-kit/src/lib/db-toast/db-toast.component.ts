import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef } from '@angular/core';
import { ToastVariant } from './db-toast.types';

const HIDE_TRANSITION_MS = 350;
// Opacidad que pierde cada toast por cada toast más reciente que tenga debajo.
const OPACITY_STEP = 0.3;

@Component({
  selector: 'db-toast',
  templateUrl: './db-toast.component.html',
  styleUrls: ['./db-toast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  standalone: true,
})
export class DbToastComponent implements OnDestroy {
  constructor(
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>,
  ) {}
  @Input() variant: ToastVariant = 'info';
  @Input() message: string = '';
  @Input() time: number = 2000;

  // Posición en la pila de toasts abiertos (0 = el más reciente, abajo del todo)
  // y desplazamiento vertical en px hacia arriba. Los asigna DbToastService.
  @Input() stackIndex: number = 0;
  @Input() stackOffset: number = 0;

  get stackOpacity(): number {
    return Math.max(0, 1 - this.stackIndex * OPACITY_STEP);
  }

  getHeight(): number {
    const container = this.elementRef.nativeElement.querySelector<HTMLElement>('.toast-container');
    return container?.offsetHeight ?? 0;
  }

  // Se emite cuando el toast termina de ocultarse (incluida la transición CSS),
  // para que quien lo creó dinámicamente (DbToastService) sepa cuándo destruirlo.
  @Output() closed = new EventEmitter<void>();

  private _visible = false;
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private closedTimeoutId: ReturnType<typeof setTimeout> | null = null;

  @Input()
  set visible(value: boolean) {
    if (value) {
      this.show();
    } else {
      this._visible = false;
      this.clearHideTimer();
      this.scheduleClosedEmit();
    }
  }
  get visible(): boolean {
    return this._visible;
  }

  show(): void {
    this._visible = true;
    this.clearHideTimer();
    this.clearClosedTimer();
    this.hideTimeoutId = setTimeout(() => {
      this._visible = false;
      this.cdr.markForCheck();
      this.scheduleClosedEmit();
    }, this.time);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.clearHideTimer();
    this.clearClosedTimer();
  }

  private scheduleClosedEmit(): void {
    this.clearClosedTimer();
    this.closedTimeoutId = setTimeout(() => this.closed.emit(), HIDE_TRANSITION_MS);
  }

  private clearClosedTimer(): void {
    if (this.closedTimeoutId !== null) {
      clearTimeout(this.closedTimeoutId);
      this.closedTimeoutId = null;
    }
  }

  private clearHideTimer(): void {
    if (this.hideTimeoutId !== null) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }

  get variantClass(): string {
    return {
      success: 'bg-success-500',
      error: 'bg-error-500',
      warning: 'bg-warning-500',
      primary: 'bg-brand-500',
      info: 'bg-black',
    }[this.variant];
  }

  get iconName(): string {
    return {
      success: 'check_circle',
      error: 'close',
      warning: 'warning',
      primary: 'info',
      info: 'info',
    }[this.variant];
  }
}
