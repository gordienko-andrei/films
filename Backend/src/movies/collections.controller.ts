import { Controller, Get, Logger } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('collections')
export class CollectionsController {
  private readonly logger = new Logger(CollectionsController.name);

  constructor(private readonly moviesService: MoviesService) {}

  @Get('recently-discussed')
  async getRecentlyDiscussed() {
    this.logger.log('Getting recently discussed movies');
    const movies = await this.moviesService.getRecentlyDiscussed();
    this.logger.log(`Found ${movies.length} recently discussed movies`);
    return movies;
  }

  @Get('new-movies')
  async getNewMovies() {
    this.logger.log('Getting new movies');
    const movies = await this.moviesService.getNewMovies();
    this.logger.log(`Found ${movies.length} new movies`);
    return movies;
  }

  @Get('trending')
  async getTrending() {
    this.logger.log('Getting trending movies');
    const movies = await this.moviesService.getTrending();
    this.logger.log(`Found ${movies.length} trending movies`);
    return movies;
  }

  @Get('popular')
  async getPopular() {
    this.logger.log('Getting popular movies');
    const movies = await this.moviesService.getPopular();
    this.logger.log(`Found ${movies.length} popular movies`);
    return movies;
  }
} 