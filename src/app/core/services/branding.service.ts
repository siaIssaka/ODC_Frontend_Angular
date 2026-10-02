import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type LogoSlot = 'header' | 'footer';
export interface Branding { headerLogoKey: string | null; footerLogoKey: string | null }

/** Logos du site : personnalisés par l'admin, sinon logo Orange par défaut (asset livré avec l'application). */
@Injectable({ providedIn: 'root' })
export class BrandingService {
  static readonly DEFAULT_LOGO = '/brand/orange-logo.png';
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  private readonly keys = signal<Branding>({ headerLogoKey: null, footerLogoKey: null });

  readonly headerLogo = computed(() => this.url(this.keys().headerLogoKey));
  readonly footerLogo = computed(() => this.url(this.keys().footerLogoKey));

  constructor() { this.refresh(); }

  refresh(): void {
    this.http.get<Branding>(`${this.base}/settings/branding`).subscribe({ next: (k) => this.keys.set(k), error: () => undefined });
  }

  isCustom(slot: LogoSlot): boolean {
    return !!(slot === 'header' ? this.keys().headerLogoKey : this.keys().footerLogoKey);
  }

  upload(slot: LogoSlot, file: File): Observable<Branding> {
    const f = new FormData();
    f.append('file', file, file.name);
    return this.http.post<Branding>(`${this.base}/settings/branding/${slot}/logo`, f).pipe(tap((k) => this.keys.set(k)));
  }

  reset(slot: LogoSlot): Observable<Branding> {
    return this.http.delete<Branding>(`${this.base}/settings/branding/${slot}/logo`).pipe(tap((k) => this.keys.set(k)));
  }

  private url(key: string | null): string {
    return key ? `${this.base}/media/${key}` : BrandingService.DEFAULT_LOGO;
  }
}
