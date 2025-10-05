import { Injectable } from '@angular/core';
import { Emoji } from '../../../interfaces/emoji.interface';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface EmotionsResponse {
  emotions: Emoji[];
}

@Injectable({
  providedIn: 'root'
})
export class EmojiService {
  private apiUrl = 'http://localhost:3000/films';

  constructor(private http: HttpClient) { }

  loadAllEmojisForFilm(id: string): Observable<Emoji[]> {
    return this.http.get<EmotionsResponse>(`${this.apiUrl}/${id}/emotions`)
      .pipe(
        map(response => response.emotions)
      );
  }

  getUserEmotionsForFilm(id: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/${id}/user-emotions`);
  }

  toggleEmotion(filmId: string, emotionId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${filmId}/emotions`, { emotionId });
  }
}
