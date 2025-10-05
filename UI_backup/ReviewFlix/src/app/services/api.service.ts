import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie } from '../interfaces/movie.interface';
import { Review } from '../interfaces/review.interface';
import { User } from '../interfaces/user.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getUrl(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  // Методы для работы с фильмами
  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.getUrl('/movies'));
  }

  getMovie(id: string): Observable<Movie> {
    return this.http.get<Movie>(this.getUrl(`/movies/${id}`));
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
} 