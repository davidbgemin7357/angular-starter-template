import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scroll-lock';

/** Duración de la animación de entrada/salida (debe coincidir con el .css). Mismo valor que
 * DbAlertModalComponent. */
const TRANSITION_DURATION_MS = 200;

@Component({
  selector: 'db-modal',
  imports: [CommonModule],
  templateUrl: './db-modal.component.html',
  styleUrl: './db-modal.component.css',
})
export class DbModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Input() className: string = '';
  @Input() showCloseButton: boolean = true;
  @Input() isFullscreen: boolean = false;
  @Input() title?: string;
  @Input() hideOnOutsideClick: boolean = true;

  /** Mantiene el DOM montado durante la animación de salida. */
  shouldRender: boolean = false;
  /** Activa la clase modal-visible (estado final de la animación). */
  isVisible: boolean = false;

  private closeTimeoutId?: ReturnType<typeof setTimeout>;
  /** Si este modal tiene pedido el bloqueo de scroll (para no pedirlo/liberarlo dos veces). */
  private scrollLocked = false;

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.isOpen) {
      this.setScrollLock(true);
      this.startOpen();
    }
  }

  ngOnDestroy() {
    this.setScrollLock(false);
    clearTimeout(this.closeTimeoutId);
  }

  ngOnChanges(changes: SimpleChanges) {
    // Solo isOpen dispara la animación: cambiar title, className, etc. no debe reiniciarla.
    if (!changes['isOpen'] || changes['isOpen'].isFirstChange()) {
      return;
    }

    this.setScrollLock(this.isOpen);

    if (this.isOpen) {
      this.startOpen();
      return;
    }

    if (this.shouldRender) {
      this.isVisible = false;
      this.closeTimeoutId = setTimeout(() => {
        this.shouldRender = false;
        this.cdr.markForCheck();
      }, TRANSITION_DURATION_MS);
    }
  }

  public onBackdropClick(event: MouseEvent): void {
    if (!this.isFullscreen && this.hideOnOutsideClick) {
      this.close.emit();
    }
  }

  public onContentClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    if (this.isOpen && this.hideOnOutsideClick) this.close.emit();
  }

  /** Monta el modal y activa la clase en el siguiente frame para que la transición parta del
   * estado inicial (opacidad 0, levemente escalado). */
  private startOpen(): void {
    clearTimeout(this.closeTimeoutId);
    this.shouldRender = true;
    requestAnimationFrame(() => {
      this.isVisible = true;
      this.cdr.markForCheck();
    });
  }

  private setScrollLock(locked: boolean): void {
    if (locked === this.scrollLocked) return;
    this.scrollLocked = locked;
    if (locked) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }
  }
}
