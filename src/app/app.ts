import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PwaPromptComponent } from './shared/pwa/pwa-prompt.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    PwaPromptComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
