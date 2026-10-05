import { Injectable } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DbConfirmModalComponent } from './db-confirm-modal.component';

export interface DbConfirmModalOptions {
  title?: string;
  hideOnOutsideClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DbConfirmModalService {
  constructor(private overlay: Overlay) {}

  public confirm(message: string, options: DbConfirmModalOptions = {}): Promise<boolean> {
    const overlayRef = this.overlay.create({ hasBackdrop: false });
    const componentRef = overlayRef.attach(new ComponentPortal(DbConfirmModalComponent));

    componentRef.setInput('message', message);
    if (options.title !== undefined) componentRef.setInput('title', options.title);
    if (options.hideOnOutsideClick !== undefined) {
      componentRef.setInput('hideOnOutsideClick', options.hideOnOutsideClick);
    }
    if (options.showCloseButton !== undefined) {
      componentRef.setInput('showCloseButton', options.showCloseButton);
    }
    if (options.className !== undefined) componentRef.setInput('className', options.className);

    return new Promise<boolean>((resolve) => {
      const confirmSub = componentRef.instance.confirm.subscribe((result: boolean) => {
        resolve(result);
        componentRef.setInput('isOpen', false);
      });
      const closeSub = componentRef.instance.close.subscribe(() => {
        resolve(false);
        componentRef.setInput('isOpen', false);
      });
      const closedSub = componentRef.instance.closed.subscribe(() => {
        confirmSub.unsubscribe();
        closeSub.unsubscribe();
        closedSub.unsubscribe();
        overlayRef.dispose();
      });

      componentRef.setInput('isOpen', true);
    });
  }
}
