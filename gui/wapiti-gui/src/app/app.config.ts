import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter  } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // ✅ Moduli per ngModel e ReactiveForms
import { appRoutes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])), // ✅ Assicuriamoci che venga usato
    provideAnimations(),
    importProvidersFrom(FormsModule, ReactiveFormsModule), // ✅ Supporto per ngModel
    FormsModule,
    ReactiveFormsModule
  ]
};
