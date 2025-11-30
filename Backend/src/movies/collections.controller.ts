import { Controller, Get, Logger, Query, Param, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ReviewCollectionsService } from './review-collections.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  private readonly logger = new Logger(CollectionsController.name);

  constructor(
    private readonly moviesService: MoviesService,
    private readonly reviewCollectionsService: ReviewCollectionsService,
  ) {}

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

  @Get('by-criteria/:criterionName')
  @ApiOperation({ summary: 'Get movies with high scores for specific criterion' })
  @ApiParam({ name: 'criterionName', description: 'Name of the criterion (e.g., "Сюжет", "Актерская игра")' })
  @ApiQuery({ name: 'minScore', required: false, type: Number, description: 'Minimum score (default: 7)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 20)' })
  async getMoviesByCriteria(
    @Param('criterionName') criterionName: string,
    @Query('minScore') minScore: number = 7,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`Getting movies by criterion: ${criterionName}`);
    const movies = await this.reviewCollectionsService.getMoviesByCriteria(
      criterionName,
      minScore,
      limit
    );
    this.logger.log(`Found ${movies.length} movies`);
    return movies;
  }

  @Get('by-review-tags')
  @ApiOperation({ summary: 'Get movies by review tags' })
  @ApiQuery({ name: 'tagIds', description: 'Comma-separated tag IDs (e.g., "1,2,3")' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 20)' })
  async getMoviesByReviewTags(
    @Query('tagIds') tagIds: string,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`Getting movies by review tags: ${tagIds}`);
    const tagIdsArray = tagIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const movies = await this.reviewCollectionsService.getMoviesByReviewTags(tagIdsArray, limit);
    this.logger.log(`Found ${movies.length} movies`);
    return movies;
  }

  @Get('by-pros')
  @ApiOperation({ summary: 'Get movies with similar pros' })
  @ApiQuery({ name: 'pros', description: 'Comma-separated pros (e.g., "актерская игра,сюжет")' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 20)' })
  async getMoviesByPros(
    @Query('pros') pros: string,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`Getting movies by pros: ${pros}`);
    const prosArray = pros.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const movies = await this.reviewCollectionsService.getMoviesByPros(prosArray, limit);
    this.logger.log(`Found ${movies.length} movies`);
    return movies;
  }

  @Get('by-cons')
  @ApiOperation({ summary: 'Get movies with similar cons' })
  @ApiQuery({ name: 'cons', description: 'Comma-separated cons (e.g., "слишком длинный,плохая концовка")' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 20)' })
  async getMoviesByCons(
    @Query('cons') cons: string,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`Getting movies by cons: ${cons}`);
    const consArray = cons.split(',').map(c => c.trim()).filter(c => c.length > 0);
    const movies = await this.reviewCollectionsService.getMoviesByCons(consArray, limit);
    this.logger.log(`Found ${movies.length} movies`);
    return movies;
  }

  @Get('by-similar-reviews/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get movies recommended based on similar user reviews (collaborative filtering)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 20)' })
  async getMoviesBySimilarReviews(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`Getting movies by similar reviews for user: ${userId}`);
    const movies = await this.reviewCollectionsService.getMoviesBySimilarReviews(
      parseInt(userId, 10),
      limit
    );
    this.logger.log(`Found ${movies.length} movies`);
    return movies;
  }
} 