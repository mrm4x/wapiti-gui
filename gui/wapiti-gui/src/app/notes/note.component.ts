import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../services/note.service';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss']
})
export class NoteComponent {
  @Input() note!: Note;
  @Output() update = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<Note>();

  editable = '';

  ngOnInit() { this.editable = this.note.text; }

  saveIfChanged() {
    if (this.editable.trim() && this.editable !== this.note.text) {
      this.update.emit({ ...this.note, text: this.editable.trim() });
    }
  }
}
