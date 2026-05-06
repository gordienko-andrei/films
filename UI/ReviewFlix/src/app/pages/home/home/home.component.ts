import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { MoviesService } from '../../../services/movies.service';
import { SessionService } from '../../../services/session.service';
import { Movie, MoodPick, GenrePick } from '../../../interfaces/movie.interface';
import { catchError, first, of, switchMap, tap } from 'rxjs';
import { MovieCarouselComponent } from "../../../components/movie-carousel/movie-carousel.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CarouselModule, MovieCarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  private moviesService = inject(MoviesService);
  private session = inject(SessionService);
  private platformId = inject(PLATFORM_ID);

  public recentlyDiscussedFilms: Movie[] = [];
  public newMovies: Movie[] = [];
  public trendingMovies: Movie[] = [];
  public becauseYouLiked: Movie[] = [];
  public topRatedThisWeek: Movie[] = [];
  public mostDiscussed: Movie[] = [];
  public moodPicks: MoodPick[] = [];
  public hiddenGems: Movie[] = [];
  public genrePicks: GenrePick[] = [];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.getNewMovies();
      this.getRecentlyDiscussed();
      this.getTrendingMovies();
      this.getTopRatedThisWeek();
      this.getMostDiscussed();
      this.getMoodPicks();
      this.getHiddenGems();
      this.getGenreSpotlights();
      this.loadBecauseYouLikedIfSignedIn();
    }
  }

  getNewMovies() {
    this.moviesService.getNewMovies()
      .pipe(
        tap((movies) => {
          this.newMovies = movies;
        }),
        first()
      )
      .subscribe();
  }

  getRecentlyDiscussed() {
    this.moviesService.getRecentlyDiscussed()
      .pipe(
        tap((films) => {
          this.recentlyDiscussedFilms = films;
        }),
        first()
      )
      .subscribe();
  }

  getTrendingMovies() {
    this.moviesService.getTrending()
      .pipe(
        tap((movies) => {
          this.trendingMovies = movies;
        }),
        first()
      )
      .subscribe();
  }

  private loadBecauseYouLikedIfSignedIn(): void {
    this.session
      .refresh()
      .pipe(
        first(),
        switchMap((u) =>
          u
            ? this.moviesService.getBecauseYouLiked().pipe(catchError(() => of([])))
            : of([]),
        ),
        tap((movies) => {
          this.becauseYouLiked = movies;
        }),
      )
      .subscribe();
  }

  getTopRatedThisWeek() {
    this.moviesService
      .getTopRatedThisWeek()
      .pipe(
        catchError(() => of([])),
        tap((movies) => {
          this.topRatedThisWeek = movies;
        }),
        first(),
      )
      .subscribe();
  }

  getMostDiscussed() {
    this.moviesService
      .getMostDiscussed()
      .pipe(
        catchError(() => of([])),
        tap((movies) => {
          this.mostDiscussed = movies;
        }),
        first(),
      )
      .subscribe();
  }

  getMoodPicks() {
    this.moviesService
      .getMoodPicks(12)
      .pipe(
        catchError(() => of([] as MoodPick[])),
        tap((picks) => {
          this.moodPicks = picks;
        }),
        first(),
      )
      .subscribe();
  }

  getHiddenGems() {
    this.moviesService
      .getHiddenGems()
      .pipe(
        catchError(() => of([])),
        tap((movies) => {
          this.hiddenGems = movies;
        }),
        first(),
      )
      .subscribe();
  }

  getGenreSpotlights() {
    this.moviesService
      .getGenreSpotlights(8, 12)
      .pipe(
        catchError(() => of([] as GenrePick[])),
        tap((picks) => {
          this.genrePicks = picks;
        }),
        first(),
      )
      .subscribe();
  }
}
