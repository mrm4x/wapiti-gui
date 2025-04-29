import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Note {
  _id: string;
  session: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class NoteService {
  private http = inject(HttpClient);
  private base = 'http://192.168.1.30:3000/api';

  getNotes(sessionId: string): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.base}/sessions/${sessionId}/notes`);
  }

  /** chiamare senza sessionId se hai endpoint globale /api/notes */
  getAllNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.base}/notes`);
  }

  addNote(sessionId: string, text: string): Observable<Note> {
    return this.http.post<Note>(`${this.base}/sessions/${sessionId}/notes`, { text });
  }

  updateNote(id: string, text: string): Observable<Note> {
    return this.http.put<Note>(`${this.base}/notes/${id}`, { text });
  }

  deleteNote(id: string) {
    return this.http.delete(`${this.base}/notes/${id}`);
  }
}
