import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { Movie } from '../../interfaces/movie.interface';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import {
  POSTER_CAROUSEL_NUM_SCROLL,
  POSTER_CAROUSEL_NUM_VISIBLE,
  posterCarouselResponsiveOptions,
} from '../../constants/poster-carousel.constants';

@Component({
  selector: 'app-movie-carousel',
  standalone: true,
  imports: [CarouselModule, RouterModule, CardModule],
  templateUrl: './movie-carousel.component.html',
  styleUrl: './movie-carousel.component.scss'
})
export class MovieCarouselComponent implements OnChanges {
  @Input() movies: Movie[] = [];
  @Input() title: string = "";

  readonly posterCarouselNumVisible = POSTER_CAROUSEL_NUM_VISIBLE;
  readonly posterCarouselNumScroll = POSTER_CAROUSEL_NUM_SCROLL;
  readonly posterCarouselResponsiveOptions = posterCarouselResponsiveOptions;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['title'] && changes['title'].currentValue !== changes['title'].previousValue) {
      this.title = changes['title'].currentValue;
    }
  }


}
