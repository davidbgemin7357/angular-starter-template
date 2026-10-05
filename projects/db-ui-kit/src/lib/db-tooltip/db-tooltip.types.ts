export type DbTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type DbTooltipShowEvent = 'mouseenter' | 'click' | 'focus';

export type DbTooltipAnimation = 'none' | 'fade' | 'pop';

/** Elemento al que se engancha el tooltip: el nodo, un ElementRef o un selector CSS. */
export type DbTooltipTarget = HTMLElement | { nativeElement: HTMLElement } | string | null | undefined;
