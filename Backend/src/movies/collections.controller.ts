import { Controller, Get, Logger, Query, Param, UseGuards, Request } from '@nestjs/common';
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
    this.logger.log('Getting hot new releases (release year + recent review buzz)');
    const movies = await this.moviesService.getNewMovies();
    this.logger.log(`Found ${movies.length} hot new releases`);
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

  @Get('because-you-liked')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Personal recommendations based on likes, emotions and ratings' })
  async getBecauseYouLiked(
    @Request() req: any,
    @Query('limit') limit: string = '20',
  ) {
    const safeLimit = Number.parseInt(limit, 10) || 20;
    this.logger.log(`Getting because-you-liked collection for user=${req.user.id}`);
    return this.moviesService.getBecauseYouLiked(req.user.id, safeLimit);
  }

  @Get('top-rated-this-week')
  @ApiOperation({ summary: 'Top rated movies by rating quality and activity for last N days' })
  async getTopRatedThisWeek(
    @Query('limit') limit: string = '20',
    @Query('days') days: string = '7',
  ) {
    const safeLimit = Number.parseInt(limit, 10) || 20;
    const safeDays = Number.parseInt(days, 10) || 7;
    this.logger.log(`Getting top-rated-this-week, days=${safeDays}, limit=${safeLimit}`);
    return this.moviesService.getTopRatedThisWeek(safeLimit, safeDays);
  }

  @Get('most-discussed')
  @ApiOperation({ summary: 'Most discussed movies by review volume for last N days' })
  async getMostDiscussed(
    @Query('limit') limit: string = '20',
    @Query('days') days: string = '7',
  ) {
    const safeLimit = Number.parseInt(limit, 10) || 20;
    const safeDays = Number.parseInt(days, 10) || 7;
    this.logger.log(`Getting most-discussed, days=${safeDays}, limit=${safeLimit}`);
    return this.moviesService.getMostDiscussed(safeLimit, safeDays);
  }

  @Get('mood-picks')
  @ApiOperation({ summary: 'Mood picks by emotion slug(s)' })
  async getMoodPicks(
    @Query('limit') limit: string = '12',
    @Query('moods') moods?: string,
  ) {
    const safeLimit = Number.parseInt(limit, 10) || 12;
    const moodSlugs = moods
      ? moods.split(',').map((m) => m.trim()).filter(Boolean)
      : undefined;
    this.logger.log(`Getting mood-picks, moods=${moodSlugs?.join('|') ?? 'all'}, limit=${safeLimit}`);
    return this.moviesService.getMoodPicks(safeLimit, moodSlugs);
  }

  @Get('hidden-gems')
  @ApiOperation({ summary: 'Hidden gems: high-rated movies with lower engagement' })
  async getHiddenGems(@Query('limit') limit: string = '20') {
    const safeLimit = Number.parseInt(limit, 10) || 20;
    this.logger.log(`Getting hidden-gems, limit=${safeLimit}`);
    return this.moviesService.getHiddenGems(safeLimit);
  }

  @Get('genre-spotlights')
  @ApiOperation({ summary: 'Carousel-ready genre sections (top genres in DB)' })
  @ApiQuery({ name: 'sections', required: false, description: 'Number of genre rows (default 8)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Movies per genre (default 12)' })
  async getGenreSpotlights(
    @Query('sections') sections: string = '8',
    @Query('limit') limit: string = '12',
  ) {
    const safeSections = Number.parseInt(sections, 10) || 8;
    const safeLimit = Number.parseInt(limit, 10) || 12;
    this.logger.log(`Getting genre-spotlights, sections=${safeSections}, limit=${safeLimit}`);
    return this.moviesService.getGenreSpotlights(safeSections, safeLimit);
  }

  @Get('by-genre')
  @ApiOperation({ summary: 'Movies for a single genre (primary genre field)' })
  @ApiQuery({ name: 'genre', required: true, description: 'Genre name, e.g. Drama' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max movies (default 20)' })
  async getByGenre(
    @Query('genre') genre: string,
    @Query('limit') limit: string = '20',
  ) {
    const safeLimit = Number.parseInt(limit, 10) || 20;
    this.logger.log(`Getting by-genre genre=${genre}, limit=${safeLimit}`);
    return this.moviesService.getMoviesByGenre(genre ?? '', safeLimit);
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