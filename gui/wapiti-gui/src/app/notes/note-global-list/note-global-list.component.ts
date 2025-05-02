import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NoteService } from '../../services/note.service';

@Component({
  selector: 'app-note-global-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './note-global-list.component.html',
  styleUrls: ['./note-global-list.component.scss']
})
export class NoteGlobalListComponent {
  private noteService = inject(NoteService);
  private router = inject(Router);

  notes: any[] = [];
  sessionIdMap: { [objectId: string]: string } = {};

  ngOnInit(): void {
    this.noteService.getAllNotes().subscribe({
      next: async (notes) => {
        this.notes = notes;
  
        for (const note of this.notes) {
          const objectId = note.session;
          if (!this.sessionIdMap[objectId]) {
            try {
              const res = await firstValueFrom(
                this.noteService.getSessionIdFromObjectId(objectId)
              );
              this.sessionIdMap[objectId] = res.sessionId;
            } catch (err) {
              console.error('Errore recupero sessionId:', err);
            }
          }
        }
  
        // 🔥 Raggruppa dopo aver ricevuto tutte le note
        this.groupNotesBySession();
      },
      error: err => {
        console.error('Errore nel caricamento note:', err);
      }
    });
  }
 
  openSession(sessionId: string) {
    this.router.navigate(['/sessions', sessionId]);
  }

  groupedNotes: { [key: string]: any[] } = {};

  sortedSessionIds(): string[] {
    return Object.keys(this.groupedNotes).sort(
      (a, b) => this.groupedNotes[b][0].createdAt.localeCompare(this.groupedNotes[a][0].createdAt)
    );
  }

  private groupNotesBySession(): void {
    this.groupedNotes = {};
    for (const note of this.notes) {
      const sid = note.session;
      if (!this.groupedNotes[sid]) {
        this.groupedNotes[sid] = [];
      }
      this.groupedNotes[sid].push(note);
    }
  }

}
