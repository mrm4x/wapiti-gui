import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { NoteListComponent } from '../../notes/note-list.component';

@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, NoteListComponent] 
})
export class SessionDetailComponent {
  private route      = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private router     = inject(Router);
  private socketSv   = inject(SocketService);

  session: any = null;
  fromArchives = false;
  loading = true;

  async ngOnInit(): Promise<void> {
    const sessionId = this.route.snapshot.paramMap.get('sessionId')!;

    this.loading = true;
    await this.loadDetail(sessionId);
    this.loading = false;

    this.fromArchives = history.state?.fromArchives || false;

    this.socketSv.onSessionUpdated().subscribe(({ sessionId: updatedId }) => {
      if (updatedId === sessionId) {
        this.loadDetail(sessionId);
      }
    });
  }

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
    if (this.fromArchives) {
      this.router.navigate(['/sessions/archives']);
    } else {
      this.router.navigate(['/sessions']);
    }
  }

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
