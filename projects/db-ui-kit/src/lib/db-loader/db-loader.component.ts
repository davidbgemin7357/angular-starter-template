import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

const FADE_OUT_DURATION_MS = 100;

@Component({
  selector: 'db-loader',
  templateUrl: 'db-loader.component.html',
  styleUrls: ['./db-loader.component.css'],
})
export class DbLoaderComponent implements OnChanges, OnDestroy {
  @Input() isVisible: boolean = false;
  /** true: cubre solo su contenedor (que debe tener position: relative) en vez de toda la ventana. */
  @Input() contained: boolean = false;

  shouldRender: boolean = false;
  isClosing: boolean = false;

  private hideTimeoutId?: ReturnType<typeof setTimeout>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isVisible']) {
      return;
    }

    clearTimeout(this.hideTimeoutId);

    if (this.isVisible) {
      this.isClosing = false;
      this.shouldRender = true;
      return;
    }

    if (!this.shouldRender) {
      return;
    }

    this.isClosing = true;
    this.hideTimeoutId = setTimeout(() => {
      this.shouldRender = false;
      this.isClosing = false;
      this.cdr.markForCheck();
    }, FADE_OUT_DURATION_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.hideTimeoutId);
  }
}
