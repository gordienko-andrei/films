import { Injectable } from '@angular/core';
import { Emoji } from '../../../interfaces/emoji.interface';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, of, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface EmotionsResponse {
  emotions: Emoji[];
}

@Injectable({
  providedIn: 'root'
})
export class EmojiService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = `${environment.apiUrl}/films`;
  }

  private getUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  loadAllEmojisForFilm(id: string): Observable<Emoji[]> {
    const url = this.getUrl(`/${id}/emotions`);
    return this.http.get<EmotionsResponse>(url)
      .pipe(
        map((response) => response.emotions ?? [])
      );
  }

  getUserEmotionsForFilm(id: string): Observable<number[]> {
    const url = this.getUrl(`/${id}/user-emotions`);
    return this.http.get<number[]>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          return of([]);
        }

        return throwError(() => error);
      }),
    );
  }

  toggleEmotion(filmId: string, emotionId: number): Observable<void> {
    const url = this.getUrl(`/${filmId}/emotions`);
    return this.http.post<void>(url, { emotionId });
  }
}
