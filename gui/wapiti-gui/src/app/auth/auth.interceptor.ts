import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // ✅ Recupera il token da localStorage (e non solo dalla classe)
const token = localStorage.getItem('jwt_token'); // 🔹 Recupera sempre con 'jwt_token'

  console.log('🔹 [authInterceptor] Interceptor eseguito!');
  console.log('🔹 [authInterceptor] Token recuperato:', token);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ [authInterceptor] Aggiunto token all’header Authorization');
  } else {
    console.warn('⚠️ [authInterceptor] Nessun token presente, richiesta inviata senza autenticazione');
  }

  return next(req);
};
