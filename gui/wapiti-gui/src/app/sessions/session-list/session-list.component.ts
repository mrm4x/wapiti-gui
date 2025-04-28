import { Component, inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SessionListComponent {
  private apiService = inject(ApiService);
  private router     = inject(Router);
  private socketSv   = inject(SocketService);

  sessions: any[] = [];

  // ▶ Proprietà per il modal
  selectedTitle:   string | null = null;
  selectedContent: string | null = null;

  ngOnInit(): void {
    this.loadSessions();

    // Ascolta aggiornamenti socket
    this.socketSv.onSessionUpdated().subscribe(({ sessionId }) => {
      this.apiService.getSessionById(sessionId).subscribe({
        next: updated => {
          const idx = this.sessions.findIndex(s => s.sessionId === sessionId);
          if (idx > -1) {
            this.sessions[idx] = updated;
          }
        },
        error: err => console.error('❌ Errore nel refresh della sessione:', err)
      });
    });
  }

  // ✅ Carica solo sessioni non archiviate
  loadSessions(): void {
    this.apiService.getSessions().subscribe({
      next: (data) => {
        this.sessions = data.filter((s: any) => !s.archived);
      },
      error: (err) => {
        console.error("❌ Errore nel recupero delle sessioni:", err);
      }
    });
  }

  // 🔹 Visualizza dettagli
  viewDetails(sessionId: string): void {
    this.router.navigate(['/sessions', sessionId], { state: { fromArchives: false } });
  }

  // 🔹 Crea nuova sessione
  goToNewSession(): void {
    this.router.navigate(['/sessions/new']);
  }

  // ✅ Elimina una sessione
  deleteSession(sessionId: string): void {
    if (!confirm('Sei sicuro di voler eliminare questa sessione?')) {
      return;
    }

    this.apiService.deleteSession(sessionId).subscribe({
      next: () => {
        alert('✅ Sessione eliminata con successo!');
        this.loadSessions();
      },
      error: (err) => {
        console.error('❌ Errore nella cancellazione della sessione:', err);
        alert('❌ Errore nella cancellazione della sessione.');
      }
    });
  }

  // ✅ Archivia una sessione
  archiveSession(sessionId: string): void {
    if (!confirm('Vuoi davvero archiviare questa sessione?')) {
      return;
    }

    this.apiService.archiveSession(sessionId).subscribe({
      next: () => {
        alert('✅ Sessione archiviata con successo!');
        this.loadSessions(); // ricarica la lista filtrando
      },
      error: (err) => {
        console.error('❌ Errore nell\'archiviazione della sessione:', err);
        alert('❌ Errore nell\'archiviazione della sessione.');
      }
    });
  }

  // ▶ Modal log
  showLog(sessionId: string): void {
    this.apiService.getLogContent(sessionId).subscribe({
      next: (txt) => {
        this.selectedTitle   = `Log sessione ${sessionId}`;
        this.selectedContent = txt;
      },
      error: (err) => {
        console.error('❌ Errore fetch log:', err);
      }
    });
  }

  // ▶ Modal risultato
  showResult(sessionId: string): void {
    this.apiService.getResultContent(sessionId).subscribe({
      next: (txt) => {
        let content = txt;
        try {
          content = JSON.stringify(JSON.parse(txt), null, 2);
        } catch {
          // non è JSON, lascia il testo così
        }
        this.selectedTitle   = `Esito sessione ${sessionId}`;
        this.selectedContent = content;
      },
      error: (err) => {
        console.error('❌ Errore fetch result:', err);
      }
    });
  }

  // ▶ Chiudi il modal
  closeModal(): void {
    this.selectedContent = null;
    this.selectedTitle   = null;
  }
}
