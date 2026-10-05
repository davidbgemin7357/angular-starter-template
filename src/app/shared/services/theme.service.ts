import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Theme } from './theme.interface';

@Injectable({ providedIn: 'root' })

export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('light');
  theme$ = this.themeSubject.asObservable();

  /** Tema Liquid Glass: independiente de claro/oscuro (se combina con ambos). */
  private glassSubject = new BehaviorSubject<boolean>(false);
  glass$ = this.glassSubject.asObservable();

  constructor() {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(storedTheme ?? (prefersDark ? 'dark' : 'light'));
    this.setGlass(localStorage.getItem('glass') === 'true');
  }

  toggleTheme() {
    const newTheme = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme) {
    this.themeSubject.next(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  toggleGlass() {
    this.setGlass(!this.glassSubject.value);
  }

  setGlass(enabled: boolean) {
    this.glassSubject.next(enabled);
    localStorage.setItem('glass', String(enabled));
    document.documentElement.classList.toggle('glass', enabled);
  }
}
