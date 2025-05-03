import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-new-session',
  templateUrl: './new-session.component.html',
  styleUrls: ['./new-session.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule]
})
export class NewSessionComponent implements OnInit {
  private apiService = inject(ApiService);
  private router     = inject(Router);

  // Utente e URL di base
  description = '';
  userId    = '';
  targetUrl = '';

  // Parametri Wapiti
  scope         = 'folder';
  swagger       = '';
  data          = '';
  modules       = '';
  listModules   = false;
  level         = 'normal';
  proxy         = '';
  tor           = false;
  mitmPort?: number;
  headless      = 'no';
  wait          = 0;
  authUser      = '';
  authPassword  = '';
  authMethod    = 'basic';
  //cookies: string[] = [];
  cookies: { value: string }[] = [{ value: '' }];
  skipCrawl     = false;
  resumeCrawl   = false;
  flushAttacks  = false;
  flushSession  = true;
  depth         = 3;
  tasks         = 10;
  timeout       = 5;
  scanForce     = 'normal';
  headers: { value: string }[] = [{ value: '' }];
  //headers: string[] = [];
  userAgent     = 'Wapiti/3.2.3';
  verifySsl     = false;
  colorOutput   = false;
  verbose       = 1;
  logPath       = '';
  format        = 'json';
  outputPath    = '';
  detailedReport= 1;
  noBugreport   = false;
  updateFlag    = false;
  cms           = '';
  wappUrl       = '';
  wappDir       = '';

  ngOnInit() {
    const stored = this.apiService.loadUserId();
    if (stored) {
      this.userId = stored;
    } else {
      this.apiService.getUserId().subscribe({
        next: res => {
          if (res.id) {
            this.userId = res.id;
            this.apiService.saveUserId(this.userId);
          }
        },
        error: err => console.error('❌ Errore nel recupero dell’ID utente:', err)
      });
    }
  }

  /*
  addCookie() { this.cookies.push(''); }
  removeCookie(i: number) { this.cookies.splice(i, 1); }
  addHeader() { this.headers.push(''); }
  removeHeader(i: number) { this.headers.splice(i, 1); }
  */

  addCookie() {
    this.cookies.push({ value: '' });
  }
  
  removeCookie(index: number) {
    this.cookies.splice(index, 1);
  }
  
  addHeader() {
    this.headers.push({ value: '' });
  }
  
  removeHeader(index: number) {
    this.headers.splice(index, 1);
  }
  
  trackByIndex(index: number, item: any) {
    return index;
  }  

  startScan() {
    if (!this.targetUrl.trim()) {
      alert('❌ Inserisci un URL valido!');
      return;
    }
    if (!this.userId) {
      alert('❌ Impossibile determinare l’utente.');
      return;
    }

    const extra: string[] = [];
    if (this.scope !== 'folder')       extra.push('--scope', this.scope);
    if (this.swagger)                  extra.push('--swagger', this.swagger);
    if (this.data)                     extra.push('--data', this.data);
    if (this.modules)                  extra.push('-m', this.modules);
    if (this.listModules)              extra.push('--list-modules');
    if (this.level !== 'normal')       extra.push('-l', this.level);
    if (this.proxy)                    extra.push('-p', this.proxy);
    if (this.tor)                      extra.push('--tor');
    if (this.mitmPort != null)         extra.push('--mitm-port', this.mitmPort.toString());
    if (this.headless !== 'no')        extra.push('--headless', this.headless);
    if (this.wait > 0)                 extra.push('--wait', this.wait.toString());
    if (this.authUser)                 extra.push('--auth-user', this.authUser);
    if (this.authPassword)             extra.push('--auth-password', this.authPassword);
    if (this.authMethod !== 'basic')   extra.push('--auth-method', this.authMethod);
    //this.cookies.filter(c => c).forEach(c => extra.push('-C', c));
    this.cookies.filter(c => c.value.trim() !== '').forEach(c => extra.push('-C', c.value));
    if (this.skipCrawl)                extra.push('--skip-crawl');
    if (this.resumeCrawl)              extra.push('--resume-crawl');
    if (this.flushAttacks)             extra.push('--flush-attacks');
    if (this.flushSession)             extra.push('--flush-session');
    if (this.depth !== 3)              extra.push('-d', this.depth.toString());
    if (this.tasks !== 10)             extra.push('--tasks', this.tasks.toString());
    if (this.timeout !== 5)            extra.push('-t', this.timeout.toString());
    if (this.scanForce !== 'normal')   extra.push('-S', this.scanForce);
    //this.headers.filter(h => h).forEach(h => extra.push('-H', h));
    this.headers.filter(h => h.value.trim() !== '').forEach(h => extra.push('-H', h.value));
    if (this.userAgent)                extra.push('-A', this.userAgent);
    if (this.verifySsl)                extra.push('--verify-ssl', '1');
    if (this.colorOutput)              extra.push('--color');
    if (this.verbose !== 1)            extra.push('-v', this.verbose.toString());
    if (this.logPath)                  extra.push('--log', this.logPath);
    if (this.format !== 'html')        extra.push('-f', this.format);
    if (this.outputPath)               extra.push('-o', this.outputPath);
    if (this.detailedReport !== 1)     extra.push('-dr', this.detailedReport.toString());
    if (this.noBugreport)              extra.push('--no-bugreport');
    if (this.updateFlag)               extra.push('--update');
    if (this.cms)                      extra.push('--cms', this.cms);
    if (this.wappUrl)                  extra.push('--wapp-url', this.wappUrl);
    if (this.wappDir)                  extra.push('--wapp-dir', this.wappDir);

    const sessionData = {
      userId: this.userId,
      targetUrl: this.targetUrl,
      description: this.description,
      extraParams: extra
    };

    this.apiService.startSession(sessionData).subscribe({
      next: () => {
        alert('✅ Scansione avviata!');
        this.router.navigate(['/sessions']);
      },
      error: err => console.error('❌ Errore avvio scansione:', err)
    });
  }
}