import { Component, inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SessionListComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);
  sessions: any[] = [];

  ngOnInit() {
    this.apiService.getSessions().subscribe({
      next: (data) => {
        //console.log("✅ Sessioni ricevute:", data);
        this.sessions = data;
      },
      error: (err) => {
        console.error("❌ Errore nel caricamento delle sessioni:", err);
      }
    });
  }

  // ✅ Metodo per visualizzare i dettagli della sessione
  viewDetails(sessionId: string) {
    this.router.navigate(['/sessions', sessionId]);
  }
  
  // 🔹 Metodo per navigare alla pagina di creazione della sessione
  goToNewSession() {
    this.router.navigate(['/sessions/new']);
  }

  // ✅ Metodo per caricare la lista delle sessioni
  loadSessions() {
    this.apiService.getSessions().subscribe({
      next: (data) => {
        //console.log("✅ Sessioni ricevute:", data);
        this.sessions = data;
      },
      error: (err) => {
        console.error("❌ Errore nel recupero delle sessioni:", err);
      }
    });
  }

  // ✅ Metodo per eliminare una sessione
  deleteSession(sessionId: string) {
    if (!confirm('Sei sicuro di voler eliminare questa sessione?')) {
      return;
    }

    this.apiService.deleteSession(sessionId).subscribe({
      next: () => {
        alert('✅ Sessione eliminata con successo!');
        this.loadSessions(); // Ricarica la lista delle sessioni
      },
      error: (err) => {
        console.error('❌ Errore nella cancellazione della sessione:', err);
        alert('❌ Errore nella cancellazione della sessione.');
      }
    });
  }
}
