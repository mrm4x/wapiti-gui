// src/app/auth/logout/logout.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-logout',
  template: `<p class="text-center p-4">👋 Disconnessione in corso…</p>`,
  imports: [CommonModule]  
})
export class LogoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.auth.logout();          // 1️⃣ svuota il token
    this.router.navigate(['/']); // 2️⃣ torna alla root → redirectTo:'login'
  }
}
