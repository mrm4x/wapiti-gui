import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true, 
  imports: [CommonModule, FormsModule]
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  redirecting = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Se già loggato, vai direttamente alla lista sessioni
    if (this.authService.isLoggedIn()) {
      this.redirecting = true;        
      this.cdr.detectChanges();        // forza il rendering immediato

      setTimeout(() => {
        this.router.navigate(['/sessions']);
      }, 1000);
    }
  }

  onSubmit() {
    if (!this.email || !this.password) {
      alert("❌ Email e password sono obbligatorie!");
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (token) => {
        console.log("✅ Login effettuato con successo! Token ricevuto.");

        // ✅ Carica l'ID utente solo dopo login
        this.apiService.getUserId().subscribe({
          next: (userResponse) => {
            console.log("✅ ID utente recuperato:", userResponse.id);
            this.apiService.saveUserId(userResponse.id);

            // 👇 mostra lo spinner e poi reindirizza
            this.redirecting = true;
            this.cdr.detectChanges();  // forza l'aggiornamento immediato

            setTimeout(() => {
              this.router.navigate(['/sessions']);
            }, 1000);
          },
          error: (err) => {
            console.error("❌ Errore nel recupero dell'ID utente:", err);
          }
        });
      },
      error: (err) => {
        console.error("❌ Errore nel login:", err);
        alert("Credenziali non valide o errore del server!");
      }
    });
  }
}
