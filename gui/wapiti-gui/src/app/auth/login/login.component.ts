import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true, 
  imports: [FormsModule]
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private apiService: ApiService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      alert("❌ Email e password sono obbligatorie!");
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (token) => {
        console.log("✅ Login effettuato con successo! Token ricevuto.");

        // ✅ Chiede al server l'ID utente SOLO dopo che il login è riuscito
        this.apiService.getUserId().subscribe({
          next: (userResponse) => {
            console.log("✅ ID utente recuperato:", userResponse.id);
            this.apiService.saveUserId(userResponse.id);
            this.router.navigate(['/sessions']); // ✅ Reindirizza l'utente
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
