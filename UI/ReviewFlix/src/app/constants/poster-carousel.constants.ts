import { CarouselResponsiveOptions } from 'primeng/carousel';

/**
 * Десктоп: 3 карточки. На мобильных (≤767px) — 2, постеры крупнее.
 * Дробное «3.5» в PrimeNG ломает translate — градиент у .poster-carousel в styles.scss.
 */
export const POSTER_CAROUSEL_NUM_VISIBLE = 3;
export const POSTER_CAROUSEL_NUM_SCROLL = 1;

export const posterCarouselResponsiveOptions: CarouselResponsiveOptions[] = [
  { breakpoint: '767px', numVisible: 2, numScroll: 1 },
];
