import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { Movie } from '../../interfaces/movie.interface';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-movie-carousel',
  standalone: true,
  imports: [CarouselModule, RouterModule],
  templateUrl: './movie-carousel.component.html',
  styleUrl: './movie-carousel.component.scss'
})
export class MovieCarouselComponent implements OnChanges {
  @Input() movies: Movie[] = [];
  @Input() title: string = "";

  public responsiveOptions: any[] = [
    {
        breakpoint: '1400px',
        numVisible: 2,
        numScroll: 1
    },
    {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 1
    },
    {
        breakpoint: '767px',
        numVisible: 2,
        numScroll: 1
    },
    {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1
    }
  ]

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['title'] && changes['title'].currentValue !== changes['title'].previousValue) {
      this.title = changes['title'].currentValue;
    }
  }


}
