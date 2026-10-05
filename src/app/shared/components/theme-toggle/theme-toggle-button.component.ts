import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@shared/services/theme.service';

@Component({
  selector: 'app-theme-toggle-button',
  templateUrl: './theme-toggle-button.component.html',
  imports:[CommonModule],
  host: { class: 'flex items-center gap-2 2xsm:gap-3' },
})
export class ThemeToggleButtonComponent {

  theme$;
  glass$;

  constructor(private themeService: ThemeService) {
    this.theme$ = this.themeService.theme$;
    this.glass$ = this.themeService.glass$;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleGlass() {
    this.themeService.toggleGlass();
  }
}
