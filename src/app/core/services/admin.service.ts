import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateAdminRequest, CreateManagedUserRequest, RegisterResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  createAdmin(payload: CreateAdminRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/admin/create-admin`, payload);
  }

  createUser(payload: CreateManagedUserRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/admin/users`, payload);
  }

  setUserActive(userId: number, active: boolean): Observable<User> {
    return this.http.patch<User>(`${this.base}/admin/users/${userId}/status`, { active });
  }
}
