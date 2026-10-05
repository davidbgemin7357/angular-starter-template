import { Injectable } from '@angular/core';
import type { DbRadioComponent } from './db-radio.component';

/**
 * Registro global de radios agrupados por `name`. Cuando el usuario selecciona un
 * radio, los demás del mismo grupo se desmarcan (Angular solo notifica al accessor
 * que cambió, por lo que los hermanos conservarían `checked = true`).
 */
@Injectable({ providedIn: 'root' })
export class DbRadioRegistry {
  private readonly groups = new Map<string, Set<DbRadioComponent>>();

  register(radio: DbRadioComponent): void {
    if (!radio.name) {
      return;
    }
    let group = this.groups.get(radio.name);
    if (!group) {
      group = new Set<DbRadioComponent>();
      this.groups.set(radio.name, group);
    }
    group.add(radio);
  }

  unregister(radio: DbRadioComponent): void {
    for (const [name, group] of this.groups) {
      if (group.delete(radio) && group.size === 0) {
        this.groups.delete(name);
      }
    }
  }

  select(radio: DbRadioComponent): void {
    const group = radio.name ? this.groups.get(radio.name) : undefined;
    group?.forEach((other) => {
      if (other !== radio) {
        other.uncheck();
      }
    });
  }
}
