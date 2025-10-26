import { Component, inject, Input, OnInit } from '@angular/core';
import { Review } from '../../../interfaces/review.interface';
import { ReviewService } from '../../reviews/review.service'
import { take, tap } from 'rxjs';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CardModule],
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.scss'
})
export class ReviewListComponent implements OnInit{
  @Input() movieId!: string;
  private reviewService = inject(ReviewService);
  public reviews: Review[] = [];

  ngOnInit(): void {
    this.getReviews();
  }

  getReviews(): void {
    this.reviewService.getReviews(this.movieId)
    .pipe(
      take(1),
      tap((reviews) => {
        this.reviews = reviews;
      })
    )
    .subscribe();
  }
}
