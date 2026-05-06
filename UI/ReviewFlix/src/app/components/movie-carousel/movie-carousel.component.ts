import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Movie } from '../../interfaces/movie.interface';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-movie-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule],
  templateUrl: './movie-carousel.component.html',
  styleUrl: './movie-carousel.component.scss'
})
export class MovieCarouselComponent implements OnChanges {
  @Input() movies: Movie[] = [];
  @Input() title: string = "";

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['title'] && changes['title'].currentValue !== changes['title'].previousValue) {
      this.title = changes['title'].currentValue;
    }
  }

  trackByMovieId(_index: number, movie: Movie): number | string {
    return movie.id;
  }

}
