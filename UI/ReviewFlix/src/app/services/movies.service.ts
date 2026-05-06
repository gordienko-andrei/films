import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Movie, MovieSuggestionItem, MoodPick, GenrePick } from '../interfaces/movie.interface';
import { Review } from '../interfaces/review.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MoviesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  // Основные методы для работы с фильмами
  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl('/movies')); 
  }

  getMovie(id: string): Observable<Movie> {
    return this.http.get<Movie>(this.getUrl(`/movies/${id}`));
  }

  // Метод для получения рекомендаций для фильма по его id
  getSimilarMovies(id: string): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl(`/recommendations/similar/${id}`));
  }

  // Методы для работы с коллекциями фильмов
  getRecentlyDiscussed(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl('/collections/recently-discussed'));
  }

  getNewMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl('/collections/new-movies'));
  }

  getTrending(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl('/collections/trending'));
  }

  getPopular(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl('/collections/popular'));
  }

  getBecauseYouLiked(limit = 20): Observable<Movie[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<Movie[]>(this.getUrl('/collections/because-you-liked'), { params });
  }

  getTopRatedThisWeek(limit = 20, days = 7): Observable<Movie[]> {
    const params = new HttpParams().set('limit', String(limit)).set('days', String(days));
    return this.http.get<Movie[]>(this.getUrl('/collections/top-rated-this-week'), { params });
  }

  getMostDiscussed(limit = 20, days = 7): Observable<Movie[]> {
    const params = new HttpParams().set('limit', String(limit)).set('days', String(days));
    return this.http.get<Movie[]>(this.getUrl('/collections/most-discussed'), { params });
  }

  getMoodPicks(limit = 12, moods?: string): Observable<MoodPick[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (moods?.trim()) {
      params = params.set('moods', moods.trim());
    }
    return this.http.get<MoodPick[]>(this.getUrl('/collections/mood-picks'), { params });
  }

  getHiddenGems(limit = 20): Observable<Movie[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<Movie[]>(this.getUrl('/collections/hidden-gems'), { params });
  }

  getGenreSpotlights(sections = 8, limitPerGenre = 12): Observable<GenrePick[]> {
    const params = new HttpParams()
      .set('sections', String(sections))
      .set('limit', String(limitPerGenre));
    return this.http.get<GenrePick[]>(this.getUrl('/collections/genre-spotlights'), { params });
  }

  getMoviesByGenre(genre: string, limit = 20): Observable<Movie[]> {
    const params = new HttpParams().set('genre', genre).set('limit', String(limit));
    return this.http.get<Movie[]>(this.getUrl('/collections/by-genre'), { params });
  }

  // Методы для работы с рецензиями
  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.getUrl('/reviews'));
  }

  getReview(id: string): Observable<Review> {
    return this.http.get<Review>(this.getUrl(`/reviews/${id}`));
  }

  // Методы для работы с рейтингами
  getRatings(): Observable<number[]> {
    return this.http.get<number[]>(this.getUrl('/ratings'));
  }

  searchMovies(query: string, externalId?: string): Observable<Movie> {
    const params = new HttpParams().set('query', query);
    const url = this.getUrl('/movies/resolve');
    const finalParams = externalId ? params.set('externalId', externalId) : params;
    return this.http.get<Movie>(url, { params: finalParams });
  }

  suggestMovies(query: string, limit?: number): Observable<MovieSuggestionItem[]> {
    const url = this.getUrl('/movies/suggest');
    let params = new HttpParams().set('query', query);

    if (typeof limit === 'number') {
      params = params.set('limit', String(limit));
    }

    return this.http.get<MovieSuggestionItem[]>(url, { params });
  }
}
