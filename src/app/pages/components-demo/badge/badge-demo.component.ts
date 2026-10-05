import { Component, signal } from '@angular/core';
import { BadgeColor, BadgeSize, BadgeVariant, DbBadgeComponent, DbComponentCardComponent } from 'db-ui-kit-angular';

/** Vitrina de db-badge: variantes light/solid por cada color, tamanos, iconos de Material
 * Symbols y los eventos iconClick / contentClick. */
@Component({
  selector: 'app-badge-demo',
  imports: [DbBadgeComponent, DbComponentCardComponent],
  templateUrl: './badge-demo.component.html',
})
export class BadgeDemoComponent {
  public readonly variants: BadgeVariant[] = ['light', 'solid'];
  public readonly colors: BadgeColor[] = ['primary', 'success', 'error', 'warning', 'info', 'light', 'dark'];
  public readonly sizes: BadgeSize[] = ['sm', 'md'];

  public lastEvent = signal('ninguno');

  public handleIconClick(badge: string, side: 'start' | 'end'): void {
    this.lastEvent.set(`iconClick → ${side} en "${badge}"`);
  }

  public handleContentClick(badge: string): void {
    this.lastEvent.set(`contentClick en "${badge}"`);
  }
}
