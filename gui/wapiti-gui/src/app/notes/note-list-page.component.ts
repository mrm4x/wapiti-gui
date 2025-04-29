import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteListComponent } from './note-list.component';

@Component({
  selector: 'app-note-list-page',
  standalone: true,
  imports: [CommonModule, NoteListComponent],
  templateUrl: './note-list-page.component.html',
  styleUrls: ['./note-list-page.component.scss']
})
export class NoteListPageComponent {}
