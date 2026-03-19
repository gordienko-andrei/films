import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Movie, MovieSuggestionItem } from '../interfaces/movie.interface';
import { Review } from '../interfaces/review.interface';
import { User } from '../interfaces/user.interface';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MoviesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('MoviesService initialized with API URL:', this.apiUrl);
  }

  private getUrl(endpoint: string): string {
    const url = `${this.apiUrl}${endpoint}`;
    console.log('Making request to:', url);
    return url;
  }

  // Основные методы для работы с фильмами
  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl('/movies')).pipe(
      tap({
        next: (movies) => console.log('Received movies:', movies),
        error: (error) => console.error('Error fetching movies:', error)
      })
    ); 
  }

  getMovie(id: string): Observable<Movie> {
    return this.http.get<Movie>(`http://localhost:3000/movies/${id}`).pipe(
      tap({
        next: (movie) => console.log('Received movie:', movie),
        error: (error) => console.error('Error fetching movie:', error)
      })
    );
  }

  // Метод для получения рекомендаций для фильма по его id
  getSimilarMovies(id: string): Observable<Movie[]> {
    return this.http.get<Movie[]>(`http://localhost:3000/recommendations/similar/${id}`);
  }

  // Методы для работы с коллекциями фильмов
  getRecentlyDiscussed(): Observable<Movie[]> {
    return this.http.get<Movie[]>('http://localhost:3000/collections/recently-discussed').pipe(
      tap({
        next: (movies) => console.log('Received recently discussed movies:', movies),
        error: (error) => console.error('Error fetching recently discussed movies:', error)
      })
    );
  }

  getNewMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>('http://localhost:3000/collections/new-movies').pipe(
      tap({
        next: (movies) => console.log('Received new movies:', movies),
        error: (error) => console.error('Error fetching new movies:', error)
      })
    );
  }

  getTrending(): Observable<Movie[]> {
    return this.http.get<Movie[]>('http://localhost:3000/collections/trending').pipe(
      tap({
        next: (movies) => console.log('Received trending movies:', movies),
        error: (error) => console.error('Error fetching trending movies:', error)
      })
    );
  }

  getPopular(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl('/collections/popular')).pipe(
      tap({
        next: (movies) => console.log('Received popular movies:', movies),
        error: (error) => console.error('Error fetching popular movies:', error)
      })
    );
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

  // Методы для работы с пользователями
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(this.getUrl('/users/me'));
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
