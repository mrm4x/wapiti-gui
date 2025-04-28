import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { LogoutComponent } from './auth/logout/logout.component';
import { SessionListComponent } from './sessions/session-list/session-list.component';
import { SessionDetailComponent } from './sessions/session-detail/session-detail.component';
import { NewSessionComponent } from './sessions/new-session/new-session.component';
import { SettingsComponent } from './settings/settings.component';
import { authGuard } from './auth/auth.guard';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'logout',          component: LogoutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'sessions', component: SessionListComponent, canActivate: [authGuard] },
  { path: 'sessions/new', component: NewSessionComponent, canActivate: [authGuard] },
  {
    path: 'sessions/archives',
    loadComponent: () => import('./sessions/archive-list/archive-list.component').then(m => m.ArchiveListComponent),
    canActivate: [authGuard]
  },  
  { path: 'sessions/:sessionId', component: SessionDetailComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] }
];
