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
  private router     = inject(Router);

  sessions: any[] = [];

  // ▶ Proprietà per il modal
  selectedTitle:   string | null = null;
  selectedContent: string | null = null;

  ngOnInit(): void {
    this.loadSessions();
  }

  // ✅ Metodo per visualizzare i dettagli della sessione
  viewDetails(sessionId: string): void {
    this.router.navigate(['/sessions', sessionId]);
  }
  
  // 🔹 Metodo per navigare alla pagina di creazione della sessione
  goToNewSession(): void {
    this.router.navigate(['/sessions/new']);
  }

  // ✅ Metodo per caricare la lista delle sessioni
  loadSessions(): void {
    this.apiService.getSessions().subscribe({
      next: (data) => {
        this.sessions = data;
      },
      error: (err) => {
        console.error("❌ Errore nel recupero delle sessioni:", err);
      }
    });
  }

  // ✅ Metodo per eliminare una sessione
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

  // ▶ Mostra in modal il contenuto del log
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

  // ▶ Mostra in modal il contenuto del JSON di risultato
  showResult(sessionId: string): void {
    this.apiService.getResultContent(sessionId).subscribe({
      next: (txt) => {
        let content = txt;
        // se è JSON, prova a formattarlo bene
        try {
          content = JSON.stringify(JSON.parse(txt), null, 2);
        } catch {
          // non è JSON valido, mostralo così com'è
        }
        this.selectedTitle   = `Esito sessione ${sessionId}`;
        this.selectedContent = content;
      },
      error: (err) => {
        console.error('❌ Errore fetch result:', err);
      }
    });
  }

  // ▶ Chiude il modal
  closeModal(): void {
    this.selectedContent = null;
    this.selectedTitle   = null;
  }
}
