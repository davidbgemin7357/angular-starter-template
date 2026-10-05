import { TestBed } from '@angular/core/testing';
import {
  BeforeInstallPromptEvent,
  PWA_INSTALL_DISMISSED_KEY,
  PWA_INSTALL_SNOOZE_MS,
  PwaInstallService,
} from './pwa-install.service';

function fakePromptEvent(outcome: 'accepted' | 'dismissed'): BeforeInstallPromptEvent {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as BeforeInstallPromptEvent;
  Object.assign(event, {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
  });
  return event;
}

describe('PwaInstallService', () => {
  beforeEach(() => {
    localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
  });

  function createService(): PwaInstallService {
    TestBed.resetTestingModule();
    return TestBed.inject(PwaInstallService);
  }

  it('sin beforeinstallprompt no ofrece instalar', () => {
    const service = createService();
    expect(service.canInstall()).toBe(false);
  });

  it('captura beforeinstallprompt, evita la barra del navegador y habilita canInstall', () => {
    const service = createService();
    const event = fakePromptEvent('accepted');

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(service.canInstall()).toBe(true);
  });

  it('install() abre el diálogo nativo y devuelve true si el usuario acepta', async () => {
    const service = createService();
    const event = fakePromptEvent('accepted');
    window.dispatchEvent(event);

    await expect(service.install()).resolves.toBe(true);
    expect(event.prompt).toHaveBeenCalled();
    expect(service.canInstall()).toBe(false);
  });

  it('si el usuario rechaza el diálogo nativo, se recuerda el descarte', async () => {
    const service = createService();
    window.dispatchEvent(fakePromptEvent('dismissed'));

    await expect(service.install()).resolves.toBe(false);
    expect(localStorage.getItem(PWA_INSTALL_DISMISSED_KEY)).not.toBeNull();
  });

  it('dismiss() oculta el aviso y lo mantiene oculto en la siguiente visita', () => {
    const service = createService();
    window.dispatchEvent(fakePromptEvent('accepted'));
    service.dismiss();
    expect(service.canInstall()).toBe(false);

    const nextVisit = createService();
    window.dispatchEvent(fakePromptEvent('accepted'));
    expect(nextVisit.canInstall()).toBe(false);
  });

  it('vuelve a ofrecer la instalación cuando pasó el tiempo de espera', () => {
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, String(Date.now() - PWA_INSTALL_SNOOZE_MS - 1000));
    const service = createService();

    window.dispatchEvent(fakePromptEvent('accepted'));
    expect(service.canInstall()).toBe(true);
  });

  it('appinstalled marca la app como instalada y oculta el aviso', () => {
    const service = createService();
    window.dispatchEvent(fakePromptEvent('accepted'));

    window.dispatchEvent(new Event('appinstalled'));

    expect(service.isInstalled()).toBe(true);
    expect(service.canInstall()).toBe(false);
  });
});
