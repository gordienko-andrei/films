import { Injectable } from '@angular/core';
import { Emoji } from '../../../interfaces/emoji.interface';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
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
    console.log('Environment API URL:', environment.apiUrl);
    this.apiUrl = `${environment.apiUrl}/films`;
    console.log('Final API URL:', this.apiUrl);
  }

  private getUrl(endpoint: string): string {
    const url = `${this.apiUrl}${endpoint}`;
    console.log(`Constructing URL for endpoint "${endpoint}":`, url);
    return url;
  }

  loadAllEmojisForFilm(id: string): Observable<Emoji[]> {
    const url = this.getUrl(`/${id}/emotions`);
    return this.http.get<EmotionsResponse>(url)
      .pipe(
        map(response => response.emotions)
      );
  }

  getUserEmotionsForFilm(id: string): Observable<number[]> {
    // Возвращаем пустой массив для неавторизованных пользователей
    console.log('Using mock data for user emotions');
    return of([]);
  }

  toggleEmotion(filmId: string, emotionId: number): Observable<void> {
    // Для неавторизованных пользователей просто возвращаем успех
    console.log('Using mock response for toggle emotion');
    return of(void 0);
  }
}
