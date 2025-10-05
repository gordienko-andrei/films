import { Component, inject, OnInit } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { MoviesService } from '../../../services/movies.service';
import { Movie } from '../../../interfaces/movie.interface';
import { first, tap } from 'rxjs';
import { MovieCarouselComponent } from "../../../components/movie-carousel/movie-carousel.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CarouselModule, MovieCarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  private moviesService = inject(MoviesService)

  public recentlyDiscussedFilms: Movie[] = []
  public newMovies: Movie[] = [];
  public trendingMovies: Movie[] = [];  
  
  ngOnInit(): void {
    this.getNewMovies();
    this.getRecentlyDiscussed();
    this.getTrendingMovies();
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
}
