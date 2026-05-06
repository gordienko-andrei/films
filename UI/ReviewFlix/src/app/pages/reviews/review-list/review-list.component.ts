import { ChangeDetectorRef, Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Review } from '../../../interfaces/review.interface';
import { ReviewService } from '../../reviews/review.service'
import { take, tap } from 'rxjs';
import { CardModule } from 'primeng/card';
import { CreateReviewComponent } from '../create-review/create-review.component';
import { InplaceModule } from 'primeng/inplace';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { NgClass } from '@angular/common';
import { ReviewComponent } from '../review/review.component';
import { SessionService } from '../../../services/session.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CardModule, 
    CreateReviewComponent, 
    InplaceModule, 
    ButtonModule, 
    RatingModule, 
    ReactiveFormsModule, 
    FormsModule, 
    TagModule, 
    ReviewComponent],
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.scss'
})
export class ReviewListComponent implements OnInit, OnChanges {
  @Input() movieId!: string;
  private reviewService = inject(ReviewService);
  private cdr = inject(ChangeDetectorRef);
  private session = inject(SessionService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  public reviews: Review[] = [];
  public createNewReviewVisible: boolean = false;
  public fullReviewVisible: Map<number, boolean> = new Map();

  ngOnInit(): void {
    this.getReviews();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['movieId']) {
      this.movieId = changes['movieId'].currentValue;
      this.getReviews();
    }
  }

  getReviews(): void {
    this.reviewService.getReviews(this.movieId)
    .pipe(
      take(1),
      tap((reviews) => {
        this.reviews = reviews;
        reviews.forEach(review => {
          this.fullReviewVisible.set(review.id, false);
        });
        this.cdr.markForCheck();
      })
    )
    .subscribe();
  }

  toggleFullReview(reviewId: number): void {
    const current = this.fullReviewVisible.get(reviewId) || false;
    this.fullReviewVisible.set(reviewId, !current);
    this.cdr.markForCheck();
  }

  isFullReviewVisible(reviewId: number): boolean {
    return this.fullReviewVisible.get(reviewId) || false;
  }

  showCreateReview(): void {
    if (!this.session.isAuthenticated()) {
      this.messageService.add({
        severity: 'info',
        summary: 'Login required',
        detail: 'Sign in to publish reviews and track your movie taste.',
      });
      this.router.navigate(['/login']);
      return;
    }
    this.createNewReviewVisible = true;
  }

  onCreateReviewVisibility(visible: boolean): void {
    this.createNewReviewVisible = visible;
    if (!visible) {
      this.getReviews();
    }
  }

  hideCreateReview(): void {
    this.createNewReviewVisible = false;
    this.getReviews();
  }
}
