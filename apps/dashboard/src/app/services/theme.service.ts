import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal to track dark mode state (reactive) 
  private darkModeSignal = signal(false);
  // Public read-only accessor
  readonly darkMode = this.darkModeSignal.asReadonly();

  constructor() {
    // ═══════════════════════════════════════════════════                     
    // Step 1: Initialize theme from localStorage or system                    
    // ═══════════════════════════════════════════════════   
    // Load from localStorage
    const stored = localStorage.getItem('darkMode');

    if (stored !== null) {
      // User has a saved preference
      this.darkModeSignal.set(stored === 'true');
    } else {
      // No saved preference - check system setting
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkModeSignal.set(prefersDark);
    }

    // ═══════════════════════════════════════════════════                     
    // Step 2: React to signal changes (effect)                                
    // ═══════════════════════════════════════════════════ 
    // Apply theme when signal changes
    effect(() => {
      if (this.darkModeSignal()) {
        // Add 'dark' class to <html> element 
        document.documentElement.classList.add('dark');
      } else {
        // Remove 'dark' class from <html> element
        document.documentElement.classList.remove('dark');
      }
      // Persist to localStorage 
      localStorage.setItem('darkMode', String(this.darkModeSignal()));
    });
  }
  
  // Toggle between light and dark
  toggleTheme(): void {
    this.darkModeSignal.update(current => !current);
  }

  // Explicitly set theme 
  setTheme(dark: boolean): void {
    this.darkModeSignal.set(dark);
  }
}
