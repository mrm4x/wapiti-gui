import { Component, Input, inject } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';

import { NoteService, Note } from '../services/note.service';

@Component({
  selector    : 'app-note-list',
  standalone  : true,
  imports     : [CommonModule, FormsModule],
  templateUrl : './note-list.component.html',
  styleUrls   : ['./note-list.component.scss']
})
export class NoteListComponent {
  private noteSvc = inject(NoteService);

  /** Se valorizzato ⇒ mostra solo le note di quella sessione */
  @Input() sessionId: string | null = null;

  notes: Note[] = [];
  newText = '';

  /* stato editing inline */
  editingId = '';       // id nota in modifica
  editable  = '';       // testo temporaneo

  /* ---------- lifecycle ---------- */
  ngOnInit() { this.load(); }

  /* ---------- CRUD ---------- */
  private load(): void {
    const src = this.sessionId
      ? this.noteSvc.getNotes(this.sessionId)
      : this.noteSvc.getAllNotes();

    src.subscribe(n => (this.notes = n));
  }

  add(): void {
    if (!this.newText.trim() || !this.sessionId) return;

    this.noteSvc.addNote(this.sessionId, this.newText).subscribe(n => {
      this.notes.unshift(n);     // in testa (ordine cronologico desc)
      this.newText = '';
    });
  }

  /** Avvia la modifica di una nota */
  startEdit(n: Note): void {
    this.editingId = n._id;
    this.editable  = n.text;
  }

  /** Salva se è stato cambiato il testo */
  saveEdit(n: Note): void {
    if (!this.editable.trim() || this.editable === n.text) {
      this.cancelEdit();
      return;
    }

    this.noteSvc.updateNote(n._id, this.editable.trim()).subscribe(upd => {
      const i = this.notes.findIndex(x => x._id === upd._id);
      if (i > -1) this.notes[i] = upd;
      this.cancelEdit();
    });
  }

  cancelEdit(): void {
    this.editingId = '';
    this.editable  = '';
  }

  /** Chiamato dal child template quando si preme l’icona trash */
  onDelete(n: Note): void {
    if (!confirm('Eliminare la nota?')) return;

    this.noteSvc.deleteNote(n._id).subscribe(() => {
      this.notes = this.notes.filter(x => x._id !== n._id);
    });
  }
}
