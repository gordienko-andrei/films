import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map, switchMap, tap } from 'rxjs';
import { SessionService, SessionUser } from '../../services/session.service';
import { GuestIdentityService } from '../../services/guest-identity.service';

export type UserWithoutPassword = SessionUser;

export interface AuthResponse {
  access_token: string;
  user?: SessionUser;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly session = inject(SessionService);
  private readonly guestIdentity = inject(GuestIdentityService);

  login(email: string, password: string): Observable<AuthResponse> {
    const deviceId = this.guestIdentity.getOrCreate();
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password, deviceId })
      .pipe(switchMap((res) => this.session.refresh().pipe(map(() => res))));
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    const deviceId = this.guestIdentity.getOrCreate();
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, { name, email, password, deviceId })
      .pipe(switchMap((res) => this.session.refresh().pipe(map(() => res))));
  }

  logout(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.session.clear()),
    );
  }

  isAuthenticated(): boolean {
    return this.session.isAuthenticated();
  }
}
