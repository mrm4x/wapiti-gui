import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    // Sostituisci con l'URL/porta corretti del tuo server se necessario
    this.socket = io('http://192.168.1.30:3000');
  }

  /**
   * Emitted by the server when a session status changes:
   * payload = { sessionId: string; status: string }
   */
  onSessionUpdated(): Observable<{ sessionId: string; status: string }> {
    return new Observable(observer => {
      this.socket.on('sessionUpdated', data => observer.next(data));
      return () => this.socket.off('sessionUpdated');
    });
  }
}
