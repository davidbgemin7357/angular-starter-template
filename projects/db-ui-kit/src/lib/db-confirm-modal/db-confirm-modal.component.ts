import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import { DbButtonComponent } from '../db-button/db-button.component';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scroll-lock';

const TRANSITION_DURATION_MS = 200;

@Component({
  selector: 'db-confirm-modal',
  imports: [
    CommonModule,
    DbButtonComponent,
  ],
  templateUrl: './db-confirm-modal.component.html',
  styleUrl: './db-confirm-modal.component.css'
})
export class DbConfirmModalComponent {

  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Input() className: string = "";
  @Input() showCloseButton: boolean = true;
  @Input() isFullscreen: boolean = false;
  @Input() title?: string;
  @Input() message: string = "";
  @Input() hideOnOutsideClick: boolean = true;
  @Output() confirm = new EventEmitter<boolean>();

  // Se emite cuando el modal termina de ocultarse (incluida la transición de cierre),
  // para que quien lo creó dinámicamente (DbConfirmModalService) sepa cuándo destruirlo.
  @Output() closed = new EventEmitter<void>();

  shouldRender: boolean = false;
  isVisible: boolean = false;

  private closeTimeoutId?: ReturnType<typeof setTimeout>;
  /** Si este modal tiene pedido el bloqueo de scroll (para no pedirlo/liberarlo dos veces). */
  private scrollLocked = false;

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.isOpen) {
      this.setScrollLock(true);
      this.shouldRender = true;
      requestAnimationFrame(() => {
        this.isVisible = true;
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy() {
    this.setScrollLock(false);
    clearTimeout(this.closeTimeoutId);
  }

  ngOnChanges() {
    this.setScrollLock(this.isOpen);

    if (this.isOpen) {
      clearTimeout(this.closeTimeoutId);
      this.shouldRender = true;
      requestAnimationFrame(() => {
        this.isVisible = true;
        this.cdr.markForCheck();
      });
      return;
    }

    if (this.shouldRender) {
      this.isVisible = false;
      this.closeTimeoutId = setTimeout(() => {
        this.shouldRender = false;
        this.cdr.markForCheck();
        this.closed.emit();
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
