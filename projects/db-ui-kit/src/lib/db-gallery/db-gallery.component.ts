import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ObjectFit } from './db-gallery.types';

const OBJECT_FIT_CLASSES: Record<ObjectFit, string> = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};

@Component({
  selector: 'db-gallery',
  imports: [CommonModule],
  templateUrl: './db-gallery.component.html',
  styleUrls: ['./db-gallery.component.css'],
})
export class DbGalleryComponent implements OnChanges, OnDestroy {
  @Input() dataSource: string[] = [];
  @Input() loop: boolean = true;
  @Input() slideshowDelay: number = 4000;
  @Input() showNavButtons: boolean = true;
  @Input() showIndicator: boolean = true;
  @Input() objectFit: ObjectFit = 'cover';

  get objectFitClass(): string {
    return OBJECT_FIT_CLASSES[this.objectFit];
  }

  /** Índice real de la imagen visible (indicadores, botones deshabilitados). */
  public currentIndex: number = 0;
  /** Posición dentro de `slides` (que puede incluir clones en los extremos). */
  public trackPosition: number = 0;
  /** false solo durante el salto instantáneo desde un clon a la imagen real. */
  public animate: boolean = true;

  @ViewChild('track') private trackRef?: ElementRef<HTMLElement>;

  private static readonly DRAG_THRESHOLD_PX = 50;

  private slideshowIntervalId?: ReturnType<typeof setInterval>;
  private dragStartX: number | null = null;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  /** Con loop se agregan clones (última al inicio, primera al final) para que pasar de la
   * última a la primera sea un solo paso hacia adelante en vez de recorrer toda la tira
   * hacia atrás. Tras la animación se salta sin transición a la imagen real. */
  private get useClones(): boolean {
    return this.loop && this.dataSource.length > 1;
  }

  private get offset(): number {
    return this.useClones ? 1 : 0;
  }

  get slides(): string[] {
    if (!this.useClones) return this.dataSource;

    return [this.dataSource[this.dataSource.length - 1], ...this.dataSource, this.dataSource[0]];
  }

  /** Número (1-based) de la imagen real que muestra cada posición de `slides`. */
  public slideNumber(position: number): number {
    const n = this.dataSource.length;
    return ((position - this.offset + n) % n) + 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource']) {
      this.currentIndex = 0;
    }

    if (changes['dataSource'] || changes['loop']) {
      this.trackPosition = this.currentIndex + this.offset;
    }

    if (changes['dataSource'] || changes['slideshowDelay'] || changes['loop']) {
      this.restartSlideshow();
    }
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  public next(): void {
    if (!this.dataSource.length) return;
    this.snapFromClone();

    if (this.currentIndex >= this.dataSource.length - 1) {
      if (this.loop) {
        this.currentIndex = 0;
        // Con clones: un paso hacia el clon de la primera; onTrackTransitionEnd corrige.
        this.trackPosition = this.useClones ? this.dataSource.length + 1 : 0;
      }
      return;
    }

    this.currentIndex++;
    this.trackPosition = this.currentIndex + this.offset;
  }

  public prev(): void {
    if (!this.dataSource.length) return;
    this.snapFromClone();

    if (this.currentIndex <= 0) {
      if (this.loop) {
        this.currentIndex = this.dataSource.length - 1;
        this.trackPosition = this.useClones ? 0 : this.currentIndex;
      }
      return;
    }

    this.currentIndex--;
    this.trackPosition = this.currentIndex + this.offset;
  }

  public goTo(index: number): void {
    this.snapFromClone();
    this.currentIndex = index;
    this.trackPosition = index + this.offset;
    this.restartSlideshow();
  }

  public onTrackTransitionEnd(event: TransitionEvent): void {
    if (event.target !== event.currentTarget) return;
    this.snapFromClone();
  }

  /** Si la tira quedó sobre un clon, salta a la imagen real equivalente sin animación. */
  private snapFromClone(): void {
    if (!this.useClones) return;

    const isOnClone = this.trackPosition === 0 || this.trackPosition === this.dataSource.length + 1;
    if (!isOnClone) return;

    this.animate = false;
    this.trackPosition = this.currentIndex + this.offset;
    this.cdr.detectChanges();
    // Forzar reflow para que el navegador aplique la posición sin transición antes de
    // volver a activarla; si no, ambos cambios se combinan y se vería la animación.
    void this.trackRef?.nativeElement.offsetWidth;
    this.animate = true;
    this.cdr.detectChanges();
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.prev();
      this.restartSlideshow();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.next();
      this.restartSlideshow();
    }
  }

  public onPointerDown(event: PointerEvent): void {
    this.dragStartX = event.clientX;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.stopSlideshow();
  }

  public onPointerUp(event: PointerEvent): void {
    if (this.dragStartX === null) return;

    const deltaX = event.clientX - this.dragStartX;
    this.dragStartX = null;

    if (deltaX <= -DbGalleryComponent.DRAG_THRESHOLD_PX) {
      this.next();
    } else if (deltaX >= DbGalleryComponent.DRAG_THRESHOLD_PX) {
      this.prev();
    }

    this.restartSlideshow();
  }

  public onPointerCancel(): void {
    this.dragStartX = null;
    this.restartSlideshow();
  }

  public isPrevDisabled(): boolean {
    return !this.loop && this.currentIndex === 0;
  }

  public isNextDisabled(): boolean {
    return !this.loop && this.currentIndex === this.dataSource.length - 1;
  }

  private restartSlideshow(): void {
    this.stopSlideshow();

    if (this.dataSource.length <= 1 || this.slideshowDelay <= 0) return;

    // El timer corre fuera de la zona de Angular: su sola existencia no debe
    // generar ticks de CD ambientales que puedan solaparse con otro tick
    // disparado desde cualquier otra parte de la app (lo que producía NG0100).
    // En cada disparo, la mutación y su render se hacen de forma síncrona y
    // atómica con detectChanges() propio, sin depender de la señal de
    // estabilidad de zone.js ni de un tick ambiental posterior.
    this.ngZone.runOutsideAngular(() => {
      this.slideshowIntervalId = setInterval(() => {
        if (this.isNextDisabled()) {
          this.stopSlideshow();
          return;
        }
        this.next();
        this.cdr.detectChanges();
      }, this.slideshowDelay);
    });
  }

  private stopSlideshow(): void {
    clearInterval(this.slideshowIntervalId);
  }
}
