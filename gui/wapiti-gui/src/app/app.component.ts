// src/app/app.component.ts
import { Component, inject }            from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule }                 from '@angular/common';   // contiene NgIf
import { filter }                       from 'rxjs';
import { NavigationComponent }          from './layout/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,                     // 👈 necessario in modalità stand-alone
  templateUrl: './app.component.html',
  styleUrl:   './app.component.scss',
  imports: [
    RouterOutlet,
    NavigationComponent,
    CommonModule,                       // NgIf per *ngIf
  ],
})
export class AppComponent {
  title   = 'wapiti-gui';

  /** Se true, la nav NON viene mostrata */
  hideNav = false;

  private router = inject(Router);

  constructor() {
    // Aggiorna hideNav ad ogni cambio rotta
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(({ urlAfterRedirects }) => {
        const url = urlAfterRedirects || '/';
        this.hideNav =
          url === '/login' ||
          url.startsWith('/login?') ||
          url === '/logout';
      });
  }
}
