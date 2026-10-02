import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegistrationStatus {
  open: boolean;
}

@Injectable({ providedIn: 'root' })
export class RegistrationSettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getStatus(): Observable<RegistrationStatus> {
    return this.http.get<RegistrationStatus>(`${this.base}/settings/registration`);
  }

  setOpen(open: boolean): Observable<RegistrationStatus> {
    return this.http.put<RegistrationStatus>(`${this.base}/settings/registration`, { open });
  }
}
