import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Review } from '../../interfaces/review.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReview } from '../../interfaces/createReview.interface';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  constructor(private http: HttpClient) { }

  getReviews(movieId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`http://localhost:3000/reviews/${movieId}`);
  }

  sendReview(movieId: string, review: CreateReview): Observable<Review> {
    return this.http.post<Review>(`http://localhost:3000/reviews/${movieId}`, review);
  }
}
