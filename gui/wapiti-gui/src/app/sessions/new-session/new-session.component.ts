import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-session',
  templateUrl: './new-session.component.html',
  styleUrls: ['./new-session.component.scss'],
  standalone: true, // ✅ Supporto per componenti standalone in Angular 19
  imports: [FormsModule, CommonModule] // ✅ FormsModule necessario per [(ngModel)]
})
export class NewSessionComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  userId: string = '';  // ✅ Assicuriamoci che userId sia sempre una stringa
  targetUrl = '';
  extraParams = '--flush-session'; // ✅ Opzione predefinita

  ngOnInit() {
    const storedUserId = this.apiService.loadUserId();

    if (storedUserId) {
      this.userId = storedUserId; // ✅ Assegna l'ID recuperato
    } else {
      this.apiService.getUserId().subscribe({
        next: (response) => {
          if (response.id) { // ✅ Verifica che l'ID sia valido prima di salvarlo
            this.userId = response.id;
            this.apiService.saveUserId(this.userId); // ✅ Salva solo se non è null
          }
        },
        error: (err) => console.error('❌ Errore nel recupero dell’ID utente:', err)
      });
    }
  }

  startScan() {
    if (!this.targetUrl.trim()) {
      alert('❌ Inserisci un URL valido!');
      return;
    }

    if (!this.userId) {
      alert('❌ Errore: Impossibile determinare l’utente.');
      return;
    }

    const extraParamsArray = this.extraParams
      .split(' ')
      .map(param => param.trim())
      .filter(param => param !== ''); // ✅ Converte stringa in array di opzioni extra

    const sessionData = {
      userId: this.userId,
      targetUrl: this.targetUrl,
      extraParams: extraParamsArray
    };

    this.apiService.startSession(sessionData).subscribe({
      next: () => {
        alert('✅ Scansione avviata con successo!');
        this.router.navigate(['/sessions']);
      },
      error: err => console.error('❌ Errore nell’avvio della scansione:', err)
    });
  }

}
