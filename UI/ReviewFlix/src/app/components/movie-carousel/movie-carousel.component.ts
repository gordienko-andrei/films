import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Movie } from '../../interfaces/movie.interface';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';
import { SkeletonModule } from 'primeng/skeleton';
import {
  MOVIE_ROW_CAROUSEL_NUM_SCROLL,
  POSTER_CAROUSEL_NUM_VISIBLE,
  movieRowCarouselResponsiveOptions,
} from '../../constants/poster-carousel.constants';

@Component({
  selector: 'app-movie-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, CarouselModule, SkeletonModule],
  templateUrl: './movie-carousel.component.html',
  styleUrl: './movie-carousel.component.scss'
})
export class MovieCarouselComponent implements OnChanges, OnInit {
  @Input() movies: Movie[] = [];
  @Input() title: string = '';
  @Input() loading = false;
  @Input() skeletonCount = 6;

  readonly posterCarouselNumVisible = POSTER_CAROUSEL_NUM_VISIBLE;
  readonly posterCarouselNumScroll = MOVIE_ROW_CAROUSEL_NUM_SCROLL;
  readonly posterCarouselResponsiveOptions = movieRowCarouselResponsiveOptions;

  skeletonSlots: number[] = [0, 1, 2, 3, 4, 5];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['title'] && changes['title'].currentValue !== changes['title'].previousValue) {
      this.title = changes['title'].currentValue;
    }
    if (changes['skeletonCount']) {
      this.rebuildSkeletonSlots();
    }
  }

  ngOnInit(): void {
    this.rebuildSkeletonSlots();
  }

  private rebuildSkeletonSlots(): void {
    const n = Math.max(1, Math.min(Math.floor(Number(this.skeletonCount)) || 6, 12));
    this.skeletonSlots = Array.from({ length: n }, (_, i) => i);
  }

}
