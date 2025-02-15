import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://192.168.1.30:3000/api';
  private userIdKey = 'userId';

  constructor() {
    this.loadUserId();
  }

  // ✅ Recupera l'ID dell'utente loggato e lo memorizza nello storage
  getUserId(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  // ✅ Salva l'ID utente in localStorage
  saveUserId(userId: string) {
    localStorage.setItem(this.userIdKey, userId);
  }

  // ✅ Carica l'ID utente dallo storage
  loadUserId(): string | null {
    return localStorage.getItem(this.userIdKey);
  }

  // ✅ Recupera l'elenco delle sessioni
  getSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sessions`);
  }

  // ✅ Crea una nuova scansione
  startSession(sessionData: { userId: string; targetUrl: string; extraParams: string[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/sessions/start`, sessionData);
  }

  // ✅ Metodo di login
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  saveToken(token: string) {
    if (!token) {
      console.error("❌ [ApiService] Tentativo di salvare un token nullo!");
      return;
    }
    console.log("✅ [ApiService] Token salvato:", token);
    localStorage.setItem('jwt_token', token); // 🔹 Usiamo 'jwt_token' in modo coerente
  }  
  
  getToken(): string | null {
    console.log('🔹 [ApiService] Recupero del token dallo storage');
    return localStorage.getItem('jwt_token'); // 🔹 Recupera con il nome corretto
  }
  
  logout() {
    localStorage.removeItem('jwt_token'); // 🔹 Rimuove il token in modo coerente
  }  
  
  // ✅ Recupera i dettagli di una sessione specifica
  getSessionById(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sessions/${sessionId}`);
  }

  // ✅ Metodo per eliminare una sessione
  deleteSession(sessionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sessions/${sessionId}`);
  }
  
}
