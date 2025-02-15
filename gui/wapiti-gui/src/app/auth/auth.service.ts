import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://192.168.1.30:3000/api';
  private tokenKey = 'jwt_token'; // ✅ Nome unificato del token
  private authState = new BehaviorSubject<boolean>(!!localStorage.getItem(this.tokenKey));

  /**
   * Effettua il login e salva il token in localStorage
   */
  login(email: string, password: string): Observable<string> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, password }).pipe(
      map(response => {
        this.saveToken(response.token);
        return response.token;
      })
    );
  }

  /**
   * Effettua il logout e rimuove il token
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.authState.next(false);
  }

  /**
   * Restituisce un Observable per monitorare lo stato di autenticazione
   */
  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }

  /**
   * Recupera il token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * ✅ Salva il token in LocalStorage e aggiorna lo stato di autenticazione
   */
  private saveToken(token: string): void {
    if (!token) {
      console.error("❌ [AuthService] Tentativo di salvare un token nullo!");
      return;
    }
    localStorage.setItem(this.tokenKey, token);
    console.log("✅ [AuthService] Token salvato:", token);
    this.authState.next(true);
  }
}
