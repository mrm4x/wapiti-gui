import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteGlobalListComponent } from './note-global-list.component';

describe('NoteGlobalListComponent', () => {
  let component: NoteGlobalListComponent;
  let fixture: ComponentFixture<NoteGlobalListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteGlobalListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteGlobalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
