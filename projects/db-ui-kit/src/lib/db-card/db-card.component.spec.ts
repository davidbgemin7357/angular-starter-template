import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DbComponentCardComponent } from './db-card.component';

describe('DbComponentCardComponent', () => {
  let fixture: ComponentFixture<DbComponentCardComponent>;
  let component: DbComponentCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbComponentCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DbComponentCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Titulo de prueba');
  });

  it('debe crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe renderizar el titulo recibido por @Input', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h3') as HTMLElement;
    expect(heading.textContent).toContain('Titulo de prueba');
  });

  it('no debe renderizar el parrafo de descripcion cuando desc esta vacio (valor por defecto)', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });

  it('debe renderizar el parrafo de descripcion cuando desc tiene contenido', () => {
    fixture.componentRef.setInput('desc', 'Descripcion de prueba');
    fixture.detectChanges();

    const paragraph = fixture.nativeElement.querySelector('p') as HTMLElement;
    expect(paragraph).not.toBeNull();
    expect(paragraph.textContent).toContain('Descripcion de prueba');
  });

  it('debe aplicar la clase personalizada (className) al contenedor raiz', () => {
    fixture.componentRef.setInput('className', 'custom-card-class');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(root.classList.contains('custom-card-class')).toBe(true);
  });

  it('debe proyectar contenido a traves de ng-content', () => {
    @Component({
      selector: 'db-card-host',
      imports: [DbComponentCardComponent],
      template: `
        <db-card title="Host">
          <span class="projected-content">Contenido proyectado</span>
        </db-card>
      `,
    })
    class HostComponent {}

    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const projected = hostFixture.nativeElement.querySelector('.projected-content');
    expect(projected?.textContent).toContain('Contenido proyectado');
  });

  describe('slot cardActions', () => {
    @Component({
      selector: 'db-card-host-acciones',
      imports: [DbComponentCardComponent],
      template: `
        <db-card title="Host" desc="Descripcion">
          <button cardActions class="accion-cabecera">Exportar</button>
          <span class="contenido-body">Contenido del body</span>
        </db-card>
      `,
    })
    class HostConAccionesComponent {}

    it('debe proyectar el contenido marcado con cardActions en la cabecera, junto al titulo', () => {
      const hostFixture = TestBed.createComponent(HostConAccionesComponent);
      hostFixture.detectChanges();

      const accion = hostFixture.nativeElement.querySelector('.accion-cabecera') as HTMLElement;
      const heading = hostFixture.nativeElement.querySelector('h3') as HTMLElement;
      const body = hostFixture.nativeElement.querySelector('.space-y-6') as HTMLElement;

      expect(accion).not.toBeNull();
      // La cabecera es el ancestro comun: contiene el h3 y, como hermano, las acciones.
      expect(accion.parentElement?.contains(heading)).toBe(true);
      expect(body.contains(accion)).toBe(false);
    });

    it('debe seguir enviando al body el contenido sin marcar aunque haya acciones', () => {
      const hostFixture = TestBed.createComponent(HostConAccionesComponent);
      hostFixture.detectChanges();

      const body = hostFixture.nativeElement.querySelector('.space-y-6') as HTMLElement;
      const contenido = hostFixture.nativeElement.querySelector('.contenido-body') as HTMLElement;

      expect(body.contains(contenido)).toBe(true);
    });

    it('no debe añadir ningun hijo extra a la cabecera cuando la card no usa el slot', () => {
      fixture.componentRef.setInput('desc', 'Descripcion');
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h3') as HTMLElement;
      const cabecera = heading.parentElement?.parentElement as HTMLElement;

      // Sin acciones proyectadas la cabecera tiene un unico hijo (el bloque titulo + desc):
      // un contenedor vacio para el slot sumaria alto por el gap del flex.
      expect(cabecera.children.length).toBe(1);
    });
  });
});
