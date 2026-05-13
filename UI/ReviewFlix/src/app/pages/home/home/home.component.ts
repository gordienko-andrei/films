import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { MoviesService } from '../../../services/movies.service';
import { SessionService } from '../../../services/session.service';
import { Movie, MoodPick, GenrePick } from '../../../interfaces/movie.interface';
import { catchError, finalize, first, forkJoin, of, switchMap, tap } from 'rxjs';
import { MovieCarouselComponent } from '../../../components/movie-carousel/movie-carousel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CarouselModule, MovieCarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
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

  /** Один флаг на все основные коллекции: скелетоны исчезают вместе после forkJoin */
  mainFeedLoading = false;
  becauseYouLikedLoading = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.mainFeedLoading = true;
      this.becauseYouLikedLoading = true;
      this.loadMainFeed();
      this.loadBecauseYouLikedIfSignedIn();
    }
  }

  private loadMainFeed(): void {
    forkJoin({
      recentlyDiscussed: this.moviesService.getRecentlyDiscussed().pipe(catchError(() => of([] as Movie[]))),
      newMovies: this.moviesService.getNewMovies().pipe(catchError(() => of([] as Movie[]))),
      trending: this.moviesService.getTrending().pipe(catchError(() => of([] as Movie[]))),
      topRated: this.moviesService.getTopRatedThisWeek().pipe(catchError(() => of([] as Movie[]))),
      mostDiscussed: this.moviesService.getMostDiscussed().pipe(catchError(() => of([] as Movie[]))),
      moodPicks: this.moviesService.getMoodPicks(12).pipe(catchError(() => of([] as MoodPick[]))),
      hiddenGems: this.moviesService.getHiddenGems().pipe(catchError(() => of([] as Movie[]))),
      genrePicks: this.moviesService.getGenreSpotlights(8, 12).pipe(catchError(() => of([] as GenrePick[]))),
    })
      .pipe(
        tap((res) => {
          this.recentlyDiscussedFilms = res.recentlyDiscussed;
          this.newMovies = res.newMovies;
          this.trendingMovies = res.trending;
          this.topRatedThisWeek = res.topRated;
          this.mostDiscussed = res.mostDiscussed;
          this.moodPicks = res.moodPicks;
          this.hiddenGems = res.hiddenGems;
          this.genrePicks = res.genrePicks;
        }),
        finalize(() => {
          this.mainFeedLoading = false;
        }),
      )
      .subscribe();
  }

  private loadBecauseYouLikedIfSignedIn(): void {
    this.session
      .refresh()
      .pipe(
        first(),
        switchMap((u) =>
          u ? this.moviesService.getBecauseYouLiked().pipe(catchError(() => of([] as Movie[]))) : of([] as Movie[]),
        ),
        tap((movies) => {
          this.becauseYouLiked = movies;
        }),
        finalize(() => {
          this.becauseYouLikedLoading = false;
        }),
      )
      .subscribe();
  }
}
