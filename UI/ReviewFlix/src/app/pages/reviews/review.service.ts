import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Review, ReviewCriterionTemplate, ReviewTag } from '../../interfaces/review.interface';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReview } from '../../interfaces/createReview.interface';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getReviews(movieId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews/${movieId}`);
  }

  sendReview(movieId: string, review: CreateReview): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/reviews/${movieId}`, review);
  }

  getCriterionTemplates(): Observable<ReviewCriterionTemplate[]> {
    return this.http.get<ReviewCriterionTemplate[]>(`${this.apiUrl}/reviews/criterion-templates`).pipe(
      catchError(() => of([]))
    );
  }

  getReviewTags(): Observable<ReviewTag[]> {
    return this.http.get<ReviewTag[]>(`${this.apiUrl}/reviews/tags`).pipe(
      catchError(() => of([]))
    );
  }
}
