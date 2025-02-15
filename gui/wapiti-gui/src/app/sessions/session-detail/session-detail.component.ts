import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SessionDetailComponent {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private router = inject(Router);
  session: any = null;

  ngOnInit() {
    const sessionId = this.route.snapshot.paramMap.get('id');

    if (sessionId) {
      this.apiService.getSessionById(sessionId).subscribe({
        next: (data) => {
          console.log("✅ Dettagli sessione:", data);
          this.session = data;
        },
        error: (err) => {
          console.error("❌ Errore nel caricamento dei dettagli della sessione:", err);
        }
      });
    }
  }

  // ✅ Metodo per tornare alla lista delle sessioni
  goBack() {
    this.router.navigate(['/sessions']);
  }
}
