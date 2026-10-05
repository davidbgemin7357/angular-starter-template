import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

/** Evento no estándar de Chrome/Edge: se dispara cuando la app cumple los requisitos de PWA
 * (HTTPS, manifest, service worker). No existe en iOS/Safari ni en Firefox. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Clave de localStorage con la fecha (ms) en que el usuario eligió "Ahora no". */
export const PWA_INSTALL_DISMISSED_KEY = 'pwa-install-dismissed-at';
/** Tras "Ahora no" no se vuelve a ofrecer la instalación durante este tiempo. */
export const PWA_INSTALL_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

/** Detecta si la app se puede instalar y ofrece un aviso propio en lugar de la mini barra
 * genérica del navegador. En iOS (sin beforeinstallprompt) expone `showIosHint` para mostrar
 * las instrucciones de "Agregar a pantalla de inicio". */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  private readonly promptAvailable = signal(false);
  private readonly installed = signal(this.detectStandalone());
  private readonly dismissed = signal(this.readDismissed());
  private readonly ios = this.detectIosSafari();

  /** Chrome/Edge (Android o escritorio) nos entregó el evento: se puede mostrar "Instalar". */
  public readonly canInstall = computed(() => this.promptAvailable() && !this.installed() && !this.dismissed());
  /** iOS Safari: no hay instalación programática, solo instrucciones manuales. */
  public readonly showIosHint = computed(() => this.ios && !this.installed() && !this.dismissed());
  public readonly isInstalled = this.installed.asReadonly();

  constructor() {
    this.window?.addEventListener('beforeinstallprompt', (event: Event) => {
      // Evita la mini barra del navegador y guarda el evento para usarlo con nuestro botón.
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.promptAvailable.set(true);
    });

    this.window?.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.promptAvailable.set(false);
      this.installed.set(true);
    });
  }

  /** Abre el diálogo nativo de instalación. Devuelve true si el usuario aceptó. */
  public async install(): Promise<boolean> {
    const promptEvent = this.deferredPrompt;
    if (!promptEvent) return false;

    // El evento solo puede usarse una vez.
    this.deferredPrompt = null;
    this.promptAvailable.set(false);

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === 'dismissed') {
      this.dismiss();
    }

    return outcome === 'accepted';
  }

  /** "Ahora no": oculta el aviso y no lo vuelve a ofrecer hasta que pase PWA_INSTALL_SNOOZE_MS. */
  public dismiss(): void {
    this.dismissed.set(true);
    try {
      this.window?.localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, String(Date.now()));
    } catch {
      // localStorage no disponible (modo privado): solo se oculta en esta sesión.
    }
  }

  private readDismissed(): boolean {
    try {
      const raw = this.window?.localStorage.getItem(PWA_INSTALL_DISMISSED_KEY);
      if (!raw) return false;
      return Date.now() - Number(raw) < PWA_INSTALL_SNOOZE_MS;
    } catch {
      return false;
    }
  }

  private detectStandalone(): boolean {
    const nav = this.window?.navigator as (Navigator & { standalone?: boolean }) | undefined;
    return !!this.window?.matchMedia?.('(display-mode: standalone)').matches || nav?.standalone === true;
  }

  private detectIosSafari(): boolean {
    const nav = this.window?.navigator;
    if (!nav) return false;

    const ua = nav.userAgent;
    // iPadOS 13+ se presenta como Mac: se distingue por tener pantalla táctil.
    const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1);
    // En iOS solo Safari puede agregar a la pantalla de inicio de forma fiable.
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    return isIos && isSafari;
  }
}
