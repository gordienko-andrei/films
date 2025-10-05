import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MoviesService } from '../../../services/movies.service';
import { Movie } from '../../../interfaces/movie.interface';
import { finalize } from 'rxjs/operators';
import { take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../../pipes/safe.pipe';
import { EmojiRatingComponent } from '../emoji-rating/emoji-rating.component';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, EmojiRatingComponent, ChipModule],
  templateUrl: './movie.component.html',
  styleUrl: './movie.component.scss'
})
export class MovieComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private moviesService = inject(MoviesService);

  public movieId = this.route.snapshot.params['id'];
  public movie: Movie | undefined;
  public isLoading = false;

  getMovie(): void {
    this.isLoading = true;
    this.moviesService.getMovie(this.movieId)
    .pipe(
      take(1),
      finalize(() => this.isLoading = false)
    )
    .subscribe((movie) => {
      this.movie = movie;
    });
  }

  ngOnInit(): void { 
    this.getMovie();
  }
}
