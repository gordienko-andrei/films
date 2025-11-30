import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Review } from '../../interfaces/review.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReview } from '../../interfaces/createReview.interface';

export interface CriterionTemplate {
  id: number;
  name: string;
  category: string;
  weight: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewTag {
  id: number;
  name: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

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

  getCriterionTemplates(): Observable<CriterionTemplate[]> {
    return this.http.get<CriterionTemplate[]>(`${this.apiUrl}/review-criteria`);
  }

  getReviewTags(): Observable<ReviewTag[]> {
    return this.http.get<ReviewTag[]>(`${this.apiUrl}/review-tags`);
  }
}
