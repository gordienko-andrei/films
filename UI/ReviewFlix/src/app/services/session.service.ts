import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, of, tap } from 'rxjs';

/** Ответ GET /auth/me (совпадает с пользователем без пароля из Prisma). */
export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly user = signal<SessionUser | null>(null);

  refresh(): Observable<SessionUser | null> {
    return this.http.get<SessionUser>(`${this.apiUrl}/auth/me`).pipe(
      tap((u) => this.user.set(u)),
      catchError(() => {
        this.user.set(null);
        return of(null);
      }),
    );
  }

  clear(): void {
    this.user.set(null);
  }

  isAuthenticated(): boolean {
    return this.user() !== null;
  }
}
