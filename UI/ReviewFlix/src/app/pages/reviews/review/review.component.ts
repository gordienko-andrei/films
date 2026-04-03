import { Component, input, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { RatingModule } from 'primeng/rating';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { Review } from '../../../interfaces/review.interface';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    DatePipe,
    RatingModule,
    FormsModule,
    TagModule,
  ],
  templateUrl: './review.component.html',
  styleUrl: './review.component.scss',
})
export class ReviewComponent {
  review = input<Review>();

  readonly fullReviewVisible = signal(false);

  toggleFullReview(): void {
    this.fullReviewVisible.update((v) => !v);
  }
}
