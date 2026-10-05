import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Size, Variant, Type } from './db-button.types';
import { ButtonClickEvent, ButtonDropdownItem } from './db-button.interface';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-[0.6rem] py-[0.5rem] text-[0.8rem]',
  md: 'px-[0.8rem] py-[0.6rem] text-[0.8rem]',
};

const VARIANT_CLASSES: Record<Variant, Record<Type, string>> = {
  primary: {
    full: 'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300',
    outline:
      'bg-white text-brand-600 ring-1 ring-inset ring-brand-500 hover:bg-brand-50 dark:bg-gray-800 dark:text-brand-400 dark:ring-brand-500 dark:hover:bg-brand-500/10',
  },
  error: {
    full: 'bg-red-500 text-white shadow-theme-xs hover:bg-red-600 disabled:bg-red-300',
    outline:
      'bg-white text-red-600 ring-1 ring-inset ring-red-500 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:ring-red-500 dark:hover:bg-red-500/10',
  },
  warning: {
    full: 'bg-yellow-500 text-white shadow-theme-xs hover:bg-yellow-600 disabled:bg-yellow-300',
    outline:
      'bg-white text-yellow-600 ring-1 ring-inset ring-yellow-500 hover:bg-yellow-50 dark:bg-gray-800 dark:text-yellow-400 dark:ring-yellow-500 dark:hover:bg-yellow-500/10',
  },
  success: {
    full: 'bg-green-500 text-white shadow-theme-xs hover:bg-green-600 disabled:bg-green-300',
    outline:
      'bg-white text-green-600 ring-1 ring-inset ring-green-500 hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:ring-green-500 dark:hover:bg-green-500/10',
  },
};

@Component({
  selector: 'db-button',
  imports: [CommonModule],
  templateUrl: './db-button.component.html',
  styleUrls: ['./db-button.component.css'],
  standalone: true,
})
export class DbButtonComponent implements OnChanges {
  @Input() size: Size = 'md';
  @Input() variant: Variant = 'primary';
  @Input() type: Type = 'full';
  @Input() disabled: boolean = false;
  @Input() className: string = "";
  @Input() startIcon?: string;
  @Input() endIcon?: string;
  @Input() dropdownItems?: ButtonDropdownItem[];
  @Output() btnClick = new EventEmitter<ButtonClickEvent>();
  @Output() dropdownItemClick = new EventEmitter<string>();

  isDropdownOpen = false;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  // Un desplegable abierto cuando el padre bloquea el boton (una accion que arranco y sigue en
  // curso) quedaria flotando sobre un control que ya no responde.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']?.currentValue) {
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isDropdownOpen && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }

  // Cierra el desplegable cuando el foco sale del componente por completo (ej. Tab), no solo
  // al hacer click afuera — focusout burbujea y expone relatedTarget, a diferencia de blur.
  // Si el foco se mueve a otro elemento DENTRO del propio componente, no se cierra.
  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as Node | null;
    if (!relatedTarget || !this.elementRef.nativeElement.contains(relatedTarget)) {
      this.closeDropdown();
    }
  }

  public closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  get classes(): string {
    return [
      'inline-flex items-center justify-center gap-2 rounded-md select-none transition-all duration-300 ease-out',
      SIZE_CLASSES[this.size],
      VARIANT_CLASSES[this.variant][this.type],
      this.disabled
        ? 'cursor-not-allowed opacity-50'
        : 'active:scale-[0.97] active:duration-100',
      this.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  public onClick(event: Event): void {
    if (this.disabled) {
      return;
    }

    if (this.dropdownItems?.length) {
      this.isDropdownOpen = !this.isDropdownOpen;
      return;
    }

    this.btnClick.emit({
      event,
      disabled: this.disabled,
    });
  }

  // El guard va antes de cerrar: primero se decide si el evento se atiende. El atributo disabled
  // del <button> ya evita llegar hasta aqui con el raton, pero esto sigue cubriendo la llamada
  // directa al metodo y el instante en que el binding todavia no se reflejo en el DOM.
  public onDropdownItemClick(item: ButtonDropdownItem): void {
    if (this.disabled) {
      return;
    }

    this.closeDropdown();
    this.dropdownItemClick.emit(item.code);
  }
}
