import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private baseUrl = 'http://192.168.1.30:3000/api/settings'; // 🔹 Endpoint server

  constructor(private http: HttpClient) {}

  // 🔹 Recupera le impostazioni
  getSettings(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  // 🔹 Aggiorna le impostazioni
  updateSettings(settings: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, settings);
  }
}
