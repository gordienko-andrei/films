import { CarouselResponsiveOptions } from 'primeng/carousel';


export const POSTER_CAROUSEL_NUM_VISIBLE = 5;
export const POSTER_CAROUSEL_NUM_SCROLL = 1;

export const posterCarouselResponsiveOptions: CarouselResponsiveOptions[] = [
  { breakpoint: '767px', numVisible: 2, numScroll: 1 },
];

/** Ряды на главной / рекомендации: шаг прокрутки > 1 (Cast на странице фильма остаётся с numScroll 1). */
export const MOVIE_ROW_CAROUSEL_NUM_SCROLL = 3;

export const movieRowCarouselResponsiveOptions: CarouselResponsiveOptions[] = [
  { breakpoint: '767px', numVisible: 2, numScroll: 2 },
];
