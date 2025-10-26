import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Review } from '../../interfaces/review.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  constructor(private http: HttpClient) { }

  getReviews(movieId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`http://localhost:3000/reviews/${movieId}`);
  }
}
