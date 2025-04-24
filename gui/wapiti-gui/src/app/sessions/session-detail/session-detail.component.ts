import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SessionDetailComponent {
  private route      = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private router     = inject(Router);
  private socketSv   = inject(SocketService);

  session: any = null;

  // Carica i dettagli e imposta il listener per gli update
  async ngOnInit(): Promise<void> {
    const sessionId = this.route.snapshot.paramMap.get('sessionId')!;
    await this.loadDetail(sessionId);

    // Se arriva un update per questa sessione, ricarichiamo i dettagli
    this.socketSv.onSessionUpdated().subscribe(({ sessionId: updatedId }) => {
      if (updatedId === sessionId) {
        this.loadDetail(sessionId);
      }
    });
  }

  // Metodo centrale per recuperare il dettaglio sessione
  private async loadDetail(sessionId: string): Promise<void> {
    try {
      this.session = await firstValueFrom(
        this.apiService.getSessionById(sessionId)
      );
    } catch (err) {
      console.error('Errore nel caricamento dei dettagli della sessione:', err);
    }
  }

  goBack(): void {
    this.router.navigate(['/sessions']);
  }

  // Download del log
  async onDownloadLog(): Promise<void> {
    try {
      const blob = await firstValueFrom(
        this.apiService.downloadLog(this.session.sessionId)
      );
      const url = window.URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `session-${this.session.sessionId}.log`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download log fallito', err);
    }
  }

  // Download del JSON di output
  async onDownloadResult(): Promise<void> {
    try {
      const blob = await firstValueFrom(
        this.apiService.downloadResult(this.session.sessionId)
      );
      const url = window.URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `session-${this.session.sessionId}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download result fallito', err);
    }
  }
}
