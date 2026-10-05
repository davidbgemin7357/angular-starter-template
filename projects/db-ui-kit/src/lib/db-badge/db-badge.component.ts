import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { BadgeVariant, BadgeSize, BadgeColor } from './db-badge.types';

@Component({
  selector: 'db-badge',
  imports: [CommonModule],
  templateUrl: './db-badge.component.html',
})
export class DbBadgeComponent {
  @Input() variant: BadgeVariant = 'light';
  @Input() size: BadgeSize = 'md';
  @Input() color: BadgeColor = 'primary';
  @Input() startIcon?: string;
  @Input() endIcon?: string;

  @Output() iconClick = new EventEmitter<'start' | 'end'>();
  @Output() contentClick = new EventEmitter<void>();

  @HostBinding('class') get hostClasses(): string {
    return `flex`;
  }

  get baseStyles() {
    return 'inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium';
  }

  get sizeClass() {
    return {
      sm: 'text-theme-xs',
      md: 'text-sm',
    }[this.size];
  }

  get iconFontSize(): number | null {
    // El font de Material Symbols fija font-size: 24px por defecto,
    // por lo que no escala junto con sizeClass sin este override.
    return this.size === 'sm' ? 16 : null;
  }

  get colorStyles() {
    const variants = {
      light: {
        primary: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400',
        success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
        error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
        warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
        info: 'bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500',
        light: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80',
        dark: 'bg-gray-500 text-white dark:bg-white/5 dark:text-white',
      },
      solid: {
        primary: 'bg-brand-500 text-white dark:text-white',
        success: 'bg-success-500 text-white dark:text-white',
        error: 'bg-error-500 text-white dark:text-white',
        warning: 'bg-warning-500 text-white dark:text-white',
        info: 'bg-blue-light-500 text-white dark:text-white',
        light: 'bg-gray-400 dark:bg-white/5 text-white dark:text-white/80',
        dark: 'bg-gray-700 text-white dark:text-white',
      },
    };
    return variants[this.variant][this.color];
  }

  onStartIconClick(event: Event) {
    event.stopPropagation();
    this.iconClick.emit('start');
  }

  onEndIconClick(event: Event) {
    event.stopPropagation();
    this.iconClick.emit('end');
  }

  onContentClick() {
    this.contentClick.emit();
  }
}
