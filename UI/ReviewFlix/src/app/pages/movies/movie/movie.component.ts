import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MoviesService } from '../../../services/movies.service';
import { Movie, MovieCreditsSnapshot } from '../../../interfaces/movie.interface';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { EmojiRatingComponent } from '../emoji-rating/emoji-rating.component';
import { ChipModule } from 'primeng/chip';
import { MovieCarouselComponent } from '../../../components/movie-carousel/movie-carousel.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReviewListComponent } from '../../reviews/review-list/review-list.component';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, EmojiRatingComponent, ChipModule, MovieCarouselComponent, ReviewListComponent, CardModule],
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

  /** Удобно для шаблона: типизированные credits с API */
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
    )
    .subscribe();
  }

  loadMovieData(): void {
    if(!this.movieId) return;

    this.isLoading = true;

    this.moviesService.getMovie(this.movieId)
    .pipe(
      take(1),
      tap((movie) => {
        this.movie = movie;
      }),
      switchMap(() => this.moviesService.getSimilarMovies(this.movieId)),
      tap((recommendations) => {
        this.recommendations = recommendations;
      }),
      finalize(() => this.isLoading = false)
    )
    .subscribe();
  }

}
