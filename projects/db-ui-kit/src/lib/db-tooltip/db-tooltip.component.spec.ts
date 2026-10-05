import { Component, ViewChild, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DbTooltipComponent } from './db-tooltip.component';
import { DbTooltipAnimation, DbTooltipShowEvent } from './db-tooltip.types';

@Component({
  imports: [DbTooltipComponent],
  template: `
    <button #btn type="button">Target</button>
    <db-tooltip
      [target]="btn"
      [showEvent]="showEvent"
      [animation]="animation"
      [showDelay]="showDelay"
      [(visible)]="visible"
    >
      Contenido del tooltip
    </db-tooltip>
    <span id="afuera">afuera</span>
  `,
})
class HostComponent {
  @ViewChild(DbTooltipComponent) tooltip!: DbTooltipComponent;
  showEvent: DbTooltipShowEvent = 'mouseenter';
  animation: DbTooltipAnimation = 'none';
  showDelay = 0;
  visible = signal(false);
}

describe('DbTooltipComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  function tooltipInBody(): HTMLElement | null {
    return document.body.querySelector('[role="tooltip"]');
  }

  function create(configure?: (h: HostComponent) => void): void {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    configure?.(host);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    vi.useFakeTimers();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.useRealTimers();
  });

  it('muestra el tooltip al pasar el mouse sobre el target y lo mueve a document.body', () => {
    create();
    expect(tooltipInBody()).toBeNull();

    button().dispatchEvent(new MouseEvent('mouseenter'));

    const tooltip = tooltipInBody();
    expect(tooltip).not.toBeNull();
    expect(tooltip!.parentElement).toBe(document.body);
    expect(tooltip!.textContent).toContain('Contenido del tooltip');
    expect(button().getAttribute('aria-describedby')).toBe(tooltip!.id);
  });

  it('lo oculta al salir el mouse del target (tras el margen para llegar al tooltip)', () => {
    create();
    button().dispatchEvent(new MouseEvent('mouseenter'));
    button().dispatchEvent(new MouseEvent('mouseleave'));

    expect(tooltipInBody()).not.toBeNull();
    vi.advanceTimersByTime(100);
    expect(tooltipInBody()).toBeNull();
    expect(button().hasAttribute('aria-describedby')).toBe(false);
  });

  it('respeta showDelay', () => {
    create((h) => (h.showDelay = 300));
    button().dispatchEvent(new MouseEvent('mouseenter'));

    vi.advanceTimersByTime(299);
    expect(tooltipInBody()).toBeNull();
    vi.advanceTimersByTime(1);
    expect(tooltipInBody()).not.toBeNull();
  });

  it('con showEvent="click" alterna con clics y se cierra con clic fuera', () => {
    create((h) => (h.showEvent = 'click'));

    button().click();
    expect(tooltipInBody()).not.toBeNull();

    (fixture.nativeElement.querySelector('#afuera') as HTMLElement).click();
    expect(tooltipInBody()).toBeNull();

    button().click();
    expect(tooltipInBody()).not.toBeNull();
    button().click();
    expect(tooltipInBody()).toBeNull();
  });

  it('se cierra con Escape y emite visibleChange (two-way binding)', () => {
    create();
    button().dispatchEvent(new MouseEvent('mouseenter'));
    expect(host.visible()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(tooltipInBody()).toBeNull();
    expect(host.visible()).toBe(false);
  });

  it('en modo controlado se abre y cierra con [visible]', () => {
    create();

    host.visible.set(true);
    fixture.detectChanges();
    expect(tooltipInBody()).not.toBeNull();

    host.visible.set(false);
    fixture.detectChanges();
    expect(tooltipInBody()).toBeNull();
  });

  it('con animación espera la salida antes de quitar el nodo', () => {
    create((h) => (h.animation = 'fade'));
    button().dispatchEvent(new MouseEvent('mouseenter'));
    expect(tooltipInBody()!.classList.contains('is-visible')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(tooltipInBody()!.classList.contains('is-visible')).toBe(false);

    vi.advanceTimersByTime(150);
    expect(tooltipInBody()).toBeNull();
  });

  it('quita el tooltip de document.body al destruirse', () => {
    create();
    button().dispatchEvent(new MouseEvent('mouseenter'));
    expect(tooltipInBody()).not.toBeNull();

    fixture.destroy();
    expect(tooltipInBody()).toBeNull();
  });
});
