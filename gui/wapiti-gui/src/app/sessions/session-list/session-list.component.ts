import { Component, inject } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { Router }             from '@angular/router';

import { ApiService }   from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector   : 'app-session-list',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './session-list.component.html',
  styleUrls  : ['./session-list.component.scss']
})
export class SessionListComponent {
  private apiService = inject(ApiService);
  private router     = inject(Router);
  private socketSv   = inject(SocketService);

  /* ---------- lista ----------- */
  sessions: any[] = [];

  /* ---------- modal ----------- */
  selectedTitle   : string | null = null;
  selectedContent : string | null = null;
  modalKind: 'log' | 'result' | null = null;   // quale file mostra
  modalSessionId = '';                         // id sessione corrente

  /* ---------- lifecycle ----------- */
  ngOnInit(): void {
    this.loadSessions();

    this.socketSv.onSessionUpdated().subscribe(({ sessionId }) => {
      this.apiService.getSessionById(sessionId).subscribe({
        next : updated => {
          const i = this.sessions.findIndex(s => s.sessionId === sessionId);
          if (i > -1) this.sessions[i] = updated;
        },
        error: err => console.error('❌ refresh sessione', err)
      });
    });
  }

  /* ---------- api calls ----------- */
  loadSessions(): void {
    this.apiService.getSessions().subscribe({
      next : data => (this.sessions = data.filter((s: any) => !s.archived)),
      error: err  => console.error('❌ get sessions', err)
    });
  }

  /* ---------- navigazione ----------- */
  viewDetails(id: string): void      { this.router.navigate(['/sessions', id]); }
  goToNewSession(): void             { this.router.navigate(['/sessions/new']); }

  /* ---------- azioni record ----------- */
  deleteSession(id: string): void {
    if (!confirm('Eliminare la sessione?')) return;
    this.apiService.deleteSession(id).subscribe({
      next : () => this.loadSessions(),
      error: err => console.error('❌ delete', err)
    });
  }

  archiveSession(id: string): void {
    if (!confirm('Archiviare la sessione?')) return;
    this.apiService.archiveSession(id).subscribe({
      next : () => this.loadSessions(),
      error: err => console.error('❌ archive', err)
    });
  }

  /* ---------- modal LOG ----------- */
  showLog(id: string): void {
    this.apiService.getLogContent(id).subscribe({
      next : txt => {
        this.selectedTitle   = `Log sessione ${id}`;
        this.selectedContent = txt;
        this.modalKind       = 'log';
        this.modalSessionId  = id;
      },
      error: err => console.error('❌ fetch log', err)
    });
  }

  /* ---------- modal ESITO ----------- */
  showResult(id: string): void {
    this.apiService.getResultContent(id).subscribe({
      next : txt => {
        try { txt = JSON.stringify(JSON.parse(txt), null, 2); } catch {}
        this.selectedTitle   = `Esito sessione ${id}`;
        this.selectedContent = txt;
        this.modalKind       = 'result';
        this.modalSessionId  = id;
      },
      error: err => console.error('❌ fetch result', err)
    });
  }

  /* ---------- download dall’header del modal ----------- */
  downloadCurrent(): void {
    if (!this.modalKind) return;

    const obs = this.modalKind === 'log'
      ? this.apiService.downloadLog(this.modalSessionId)
      : this.apiService.downloadResult(this.modalSessionId);

    obs.subscribe({
      next : blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = this.modalKind === 'log'
          ? `session-${this.modalSessionId}.log`
          : `session-${this.modalSessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => console.error('❌ download', err)
    });
  }

  /* ---------- chiusura modal ----------- */
  closeModal(): void {
    this.selectedTitle = this.selectedContent = null;
    this.modalKind = null;
    this.modalSessionId = '';
  }
}
