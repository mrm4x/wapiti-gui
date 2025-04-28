import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-archive-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archive-list.component.html',
  styleUrls: ['./archive-list.component.scss']
})
export class ArchiveListComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private socketSv = inject(SocketService);

  sessions: any[] = [];
  selectedTitle: string | null = null;
  selectedContent: string | null = null;

  ngOnInit(): void {
    this.loadSessions();

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

  loadSessions(): void {
    this.apiService.getSessions().subscribe({
      next: (data) => {
        this.sessions = data.filter((s: any) => s.archived);
      },
      error: (err) => {
        console.error("❌ Errore nel recupero delle sessioni archiviate:", err);
      }
    });
  }

  viewDetails(sessionId: string): void {
    this.router.navigate(['/sessions', sessionId], { state: { fromArchives: true } });
  }

  restoreSession(sessionId: string): void {
    if (!confirm('Vuoi davvero ripristinare questa sessione?')) {
      return;
    }

    this.apiService.restoreSession(sessionId).subscribe({
      next: () => {
        alert('✅ Sessione ripristinata con successo!');
        this.loadSessions();
      },
      error: (err) => {
        console.error('❌ Errore nel ripristino della sessione:', err);
        alert('❌ Errore nel ripristino della sessione.');
      }
    });
  }

  showLog(sessionId: string): void {
    this.apiService.getLogContent(sessionId).subscribe({
      next: (txt) => {
        this.selectedTitle = `Log sessione ${sessionId}`;
        this.selectedContent = txt;
      },
      error: (err) => {
        console.error('❌ Errore fetch log:', err);
      }
    });
  }

  showResult(sessionId: string): void {
    this.apiService.getResultContent(sessionId).subscribe({
      next: (txt) => {
        let content = txt;
        try {
          content = JSON.stringify(JSON.parse(txt), null, 2);
        } catch {
          // non è JSON valido
        }
        this.selectedTitle = `Esito sessione ${sessionId}`;
        this.selectedContent = content;
      },
      error: (err) => {
        console.error('❌ Errore fetch result:', err);
      }
    });
  }

  closeModal(): void {
    this.selectedContent = null;
    this.selectedTitle = null;
  }
}
