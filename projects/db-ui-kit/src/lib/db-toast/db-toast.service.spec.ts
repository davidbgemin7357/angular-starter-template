import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { DbToastService } from './db-toast.service';

describe('DbToastService', () => {
  let service: DbToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should attach a db-toast to the overlay with the given variant and message', () => {
    service.open('success', 'Operación exitosa');
    TestBed.inject(ApplicationRef).tick();

    const toastEl = document.querySelector('db-toast');
    expect(toastEl).not.toBeNull();
    expect(toastEl?.textContent).toContain('Operación exitosa');
  });

  it('should dispose the overlay once the toast finishes closing', () => {
    vi.useFakeTimers();
    service.open('info', 'Mensaje', 1000);

    expect(document.querySelector('db-toast')).not.toBeNull();

    // time (1000ms) + transición CSS interna del componente (350ms)
    vi.advanceTimersByTime(1000 + 350);

    expect(document.querySelector('db-toast')).toBeNull();
  });

  it('should support multiple concurrent toasts', () => {
    service.open('success', 'Primero');
    service.open('error', 'Segundo');

    const toasts = document.querySelectorAll('db-toast');
    expect(toasts.length).toBe(2);
  });

  it('should stack older toasts above the newest one and restack when one closes', () => {
    vi.useFakeTimers();
    service.open('success', 'Primero', 5000);
    service.open('error', 'Segundo', 1000);
    TestBed.inject(ApplicationRef).tick();

    const [first, second] = Array.from(document.querySelectorAll<HTMLElement>('.toast-container'));
    expect(second.style.getPropertyValue('--db-toast-opacity')).toBe('1');
    expect(first.style.getPropertyValue('--db-toast-opacity')).toBe('0.7');
    expect(parseFloat(first.style.getPropertyValue('--db-toast-offset'))).toBeGreaterThan(0);

    // Se cierra el más reciente: el primero vuelve a la posición base.
    vi.advanceTimersByTime(1000 + 350);
    TestBed.inject(ApplicationRef).tick();

    expect(document.querySelectorAll('db-toast').length).toBe(1);
    expect(first.style.getPropertyValue('--db-toast-opacity')).toBe('1');
    expect(first.style.getPropertyValue('--db-toast-offset')).toBe('0px');
  });

  it('should inject the CDK Overlay dependency', () => {
    expect(TestBed.inject(Overlay)).toBeTruthy();
  });
});
