import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MoviesService } from '../../../services/movies.service';
import { Movie, MovieCreditsSnapshot } from '../../../interfaces/movie.interface';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { EMPTY, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { EmojiRatingComponent } from '../emoji-rating/emoji-rating.component';
import { ChipModule } from 'primeng/chip';
import { MovieCarouselComponent } from '../../../components/movie-carousel/movie-carousel.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReviewListComponent } from '../../reviews/review-list/review-list.component';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';
import { SkeletonModule } from 'primeng/skeleton';
import {
  POSTER_CAROUSEL_NUM_SCROLL,
  POSTER_CAROUSEL_NUM_VISIBLE,
  posterCarouselResponsiveOptions,
} from '../../../constants/poster-carousel.constants';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [
    CommonModule,
    EmojiRatingComponent,
    ChipModule,
    MovieCarouselComponent,
    ReviewListComponent,
    CardModule,
    CarouselModule,
    SkeletonModule,
  ],
  templateUrl: './movie.component.html',
  styleUrl: './movie.component.scss'
})
export class MovieComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private moviesService = inject(MoviesService);
  private destroyRef = inject(DestroyRef);

  public movieId = this.route.snapshot.params['id'];
  public movie: Movie | undefined;
  public isLoading = false;
  public recommendations: Movie[] = [];
  public recommendationsLoading = false;

  readonly posterCarouselNumVisible = POSTER_CAROUSEL_NUM_VISIBLE;
  readonly posterCarouselNumScroll = POSTER_CAROUSEL_NUM_SCROLL;
  readonly posterCarouselResponsiveOptions = posterCarouselResponsiveOptions;

  /** Скелетоны для ряда «Created by» / «Cast» */
  readonly creditsRowSkeletonSlots = [0, 1, 2, 3, 4, 5];

  get credits(): MovieCreditsSnapshot | null {
    const raw = this.movie?.credits;
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    return raw as MovieCreditsSnapshot;
  }

  get isTv(): boolean {
    return this.movie?.mediaType === 'tv';
  }

  ngOnInit(): void { 
    this.route.params
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((params) => {
        this.movieId = params['id'];
        this.loadMovieData();
        this.scrollMoviePageToTop();
      })
    )
    .subscribe();
  }

  private scrollMoviePageToTop(): void {
    const y = 0;
    window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    });
  }

  loadMovieData(): void {
    if (!this.movieId) return;

    this.isLoading = true;
    this.recommendationsLoading = true;
    this.movie = undefined;
    this.recommendations = [];

    this.moviesService
      .getMovie(this.movieId)
      .pipe(
        take(1),
        tap((movie) => {
          this.movie = movie;
          this.isLoading = false;
        }),
        switchMap(() => this.moviesService.getSimilarMovies(this.movieId)),
        tap((recommendations) => {
          this.recommendations = recommendations;
        }),
        catchError(() => {
          this.isLoading = false;
          this.recommendationsLoading = false;
          return EMPTY;
        }),
        finalize(() => {
          this.recommendationsLoading = false;
        }),
      )
      .subscribe();
  }

}
