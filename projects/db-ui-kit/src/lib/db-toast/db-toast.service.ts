import { ComponentRef, Injectable } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DbToastComponent } from './db-toast.component';
import { ToastVariant } from './db-toast.types';

// Separación vertical en px entre toasts apilados.
const STACK_GAP = 8;

@Injectable({
  providedIn: 'root',
})
export class DbToastService {
  constructor(private overlay: Overlay) {}

  // Toasts abiertos, del más antiguo al más reciente.
  private readonly active: ComponentRef<DbToastComponent>[] = [];

  public open(variant: ToastVariant, message: string, duration = 4000): void {
    const overlayRef = this.overlay.create();
    const componentRef = overlayRef.attach(new ComponentPortal(DbToastComponent));

    componentRef.setInput('variant', variant);
    componentRef.setInput('message', message);
    componentRef.setInput('time', duration);

    const closedSub = componentRef.instance.closed.subscribe(() => {
      closedSub.unsubscribe();
      const index = this.active.indexOf(componentRef);
      if (index !== -1) {
        this.active.splice(index, 1);
      }
      overlayRef.dispose();
      this.relayout();
    });

    this.active.push(componentRef);
    // Renderiza el mensaje para poder medir la altura real del toast.
    componentRef.changeDetectorRef.detectChanges();
    this.relayout();

    componentRef.setInput('visible', true);
  }

  // Coloca cada toast por encima de los más recientes, sumando sus alturas.
  private relayout(): void {
    let offset = 0;
    for (let i = this.active.length - 1, stackIndex = 0; i >= 0; i--, stackIndex++) {
      const ref = this.active[i];
      ref.setInput('stackIndex', stackIndex);
      ref.setInput('stackOffset', offset);
      offset += ref.instance.getHeight() + STACK_GAP;
    }
  }
}
