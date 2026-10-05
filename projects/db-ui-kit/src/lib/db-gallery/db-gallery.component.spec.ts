import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DbGalleryComponent } from './db-gallery.component';

describe('DbGalleryComponent', () => {
  let fixture: ComponentFixture<DbGalleryComponent>;
  let component: DbGalleryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbGalleryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DbGalleryComponent);
    component = fixture.componentInstance;
    vi.useFakeTimers();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el mensaje vacio y no navega cuando dataSource esta vacio', () => {
    fixture.componentRef.setInput('dataSource', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin imágenes para mostrar');

    component.next();
    component.prev();
    expect(component.currentIndex).toBe(0);
  });

  it('al hacer click en el boton siguiente avanza el indice actual', () => {
    fixture.componentRef.setInput('dataSource', ['a.jpg', 'b.jpg', 'c.jpg']);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const nextButton = buttons[1] as HTMLElement;
    nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(component.currentIndex).toBe(1);
  });

  it('con loop=true, prev() desde el primer elemento vuelve al ultimo', () => {
    fixture.componentRef.setInput('dataSource', ['a.jpg', 'b.jpg', 'c.jpg']);
    fixture.componentRef.setInput('loop', true);
    fixture.detectChanges();

    expect(component.currentIndex).toBe(0);
    component.prev();

    expect(component.currentIndex).toBe(2);
  });

  it('con loop=true, next() desde el ultimo avanza un paso al clon de la primera y luego salta a la real', () => {
    fixture.componentRef.setInput('dataSource', ['a.jpg', 'b.jpg', 'c.jpg']);
    fixture.componentRef.setInput('loop', true);
    fixture.detectChanges();

    component.goTo(2);
    expect(component.trackPosition).toBe(3);
    expect(component.slides).toEqual(['c.jpg', 'a.jpg', 'b.jpg', 'c.jpg', 'a.jpg']);

    component.next();
    expect(component.currentIndex).toBe(0);
    expect(component.trackPosition).toBe(4); // clon de la primera

    const track = fixture.nativeElement.querySelector('.flex.h-full') as HTMLElement;
    component.onTrackTransitionEnd({ target: track, currentTarget: track } as unknown as TransitionEvent);
    expect(component.trackPosition).toBe(1);
    expect(component.animate).toBe(true);
  });

  it('con loop=true, prev() desde la primera va al clon de la ultima y un nuevo next() corrige antes de avanzar', () => {
    fixture.componentRef.setInput('dataSource', ['a.jpg', 'b.jpg', 'c.jpg']);
    fixture.componentRef.setInput('loop', true);
    fixture.detectChanges();

    component.prev();
    expect(component.currentIndex).toBe(2);
    expect(component.trackPosition).toBe(0); // clon de la ultima

    // Sin transitionend (clic rapido): next() primero corrige la posicion y luego avanza.
    component.next();
    expect(component.currentIndex).toBe(0);
    expect(component.trackPosition).toBe(4);
  });

  it('con loop=false, next() en el ultimo elemento permanece igual y el boton queda deshabilitado', () => {
    fixture.componentRef.setInput('dataSource', ['a.jpg', 'b.jpg']);
    fixture.componentRef.setInput('loop', false);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const nextButton = buttons[1] as HTMLButtonElement;

    nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(component.currentIndex).toBe(1);

    nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(component.currentIndex).toBe(1);
    expect(component.isNextDisabled()).toBe(true);
    expect(nextButton.disabled).toBe(true);
  });

  it('al hacer click en un indicador (goTo) actualiza el indice actual', () => {
    fixture.componentRef.setInput('dataSource', ['a.jpg', 'b.jpg', 'c.jpg']);
    fixture.detectChanges();

    const indicators = fixture.nativeElement.querySelectorAll(
      'div.absolute.bottom-3 button'
    );
    expect(indicators.length).toBe(3);
    (indicators[2] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(component.currentIndex).toBe(2);
  });

  it('ArrowRight y ArrowLeft navegan la galeria mediante teclado', () => {
    fixture.componentRef.setInput('dataSource', ['a.jpg', 'b.jpg', 'c.jpg']);
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('div[tabindex="0"]') as HTMLElement;
    container.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    );
    expect(component.currentIndex).toBe(1);

    container.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
    );
    expect(component.currentIndex).toBe(0);
  });

  it('al cambiar dataSource se reinicia el indice actual a 0', () => {
    fixture.componentRef.setInput('dataSource', ['a.jpg', 'b.jpg', 'c.jpg']);
    fixture.detectChanges();

    component.goTo(2);
    expect(component.currentIndex).toBe(2);

    fixture.componentRef.setInput('dataSource', ['x.jpg', 'y.jpg']);
    fixture.detectChanges();

    expect(component.currentIndex).toBe(0);
  });
});
