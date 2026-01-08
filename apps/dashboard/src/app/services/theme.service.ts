import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSignal = signal(false);
  readonly darkMode = this.darkModeSignal.asReadonly();

  constructor() {
    // Load from localStorage
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      this.darkModeSignal.set(stored === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkModeSignal.set(prefersDark);
    }

    // Apply theme when signal changes
    effect(() => {
      if (this.darkModeSignal()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', String(this.darkModeSignal()));
    });
  }

  toggleTheme(): void {
    this.darkModeSignal.update(current => !current);
  }

  setTheme(dark: boolean): void {
    this.darkModeSignal.set(dark);
  }
}
