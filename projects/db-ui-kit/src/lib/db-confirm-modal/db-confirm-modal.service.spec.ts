import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { DbConfirmModalService } from './db-confirm-modal.service';

describe('DbConfirmModalService', () => {
  let service: DbConfirmModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbConfirmModalService);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should attach a db-confirm-modal with the given message', () => {
    void service.confirm('¿Seguro que deseas continuar?');
    TestBed.inject(ApplicationRef).tick();

    const modalEl = document.querySelector('db-confirm-modal');
    expect(modalEl).not.toBeNull();
    expect(modalEl?.textContent).toContain('¿Seguro que deseas continuar?');
  });

  it('should resolve true when the Confirmar button is clicked', async () => {
    const resultPromise = service.confirm('¿Confirmas?');
    TestBed.inject(ApplicationRef).tick();

    const confirmButton = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Confirmar')
    ) as HTMLButtonElement;
    confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await expect(resultPromise).resolves.toBe(true);
  });

  it('should resolve false when the Cancelar button is clicked', async () => {
    const resultPromise = service.confirm('¿Confirmas?');
    TestBed.inject(ApplicationRef).tick();

    const cancelButton = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Cancelar')
    ) as HTMLButtonElement;
    cancelButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await expect(resultPromise).resolves.toBe(false);
  });

  it('should apply the optional title when provided', () => {
    void service.confirm('Mensaje', { title: 'Atención' });
    TestBed.inject(ApplicationRef).tick();

    const modalEl = document.querySelector('db-confirm-modal');
    expect(modalEl?.textContent).toContain('Atención');
  });
});
