import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  settings: Record<string, any> = {};

  ngOnInit(): void {
    this.loadSettings();
  }

  /** Carica il JSON dal server */
  loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: data => (this.settings = data),
      error: err => console.error('❌ load settings', err)
    });
  }

  /** Ritorna il valore (helper per leggibilità) */
  getSettingValue(key: string): any {
    return this.settings[key];
  }

  /** Aggiorna il valore quando si digita */
  onInputChange(key: string, value: string): void {
    this.settings[key] = value;
  }

  /** Salva l’intero JSON sul server */
  saveSettings(): void {
    this.settingsService.updateSettings(this.settings).subscribe({
      next: () => alert('✅ Salvato!'),
      error: err => {
        console.error('❌ save settings', err);
        alert('❌ Errore nel salvataggio');
      }
    });
  }
}
