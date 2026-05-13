import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { MovieSuggestion, MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Movie, Prisma } from '@prisma/client';

type MovieRow = Movie & { creditsJson?: Prisma.JsonValue | null };

type MovieWithGenres = Omit<MovieRow, 'creditsJson'> & {
  genres: string[];
  credits: Prisma.JsonValue | null;
};

function toMovieWithGenres(movie: MovieRow): MovieWithGenres {
  const { creditsJson, ...rest } = movie;
  return {
    ...(rest as Omit<MovieRow, 'creditsJson'>),
    genres: splitGenres(movie.genre),
    credits: creditsJson ?? null,
  };
}

interface PaginatedMoviesResponse {
  movies: MovieWithGenres[];
  total: number;
  page: number;
  limit: number;
}

function splitGenres(genre?: string | null): string[] {
  return (genre ?? '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
}

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiBody({ type: CreateMovieDto })
  @ApiResponse({ status: 201, description: 'Movie created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createMovieDto: CreateMovieDto): Promise<Movie> {
    return this.moviesService.create(createMovieDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'genre', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'director', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Movies retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('genre') genre?: string,
    @Query('year') year?: number,
    @Query('director') director?: string,
  ): Promise<PaginatedMoviesResponse> {
    const result = await this.moviesService.findAll(page, limit, { genre, year, director });
    return {
      movies: result.data.map((m) => toMovieWithGenres(m as MovieRow)),
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Get movie suggestions for search dropdown' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max suggestions (1-20)' })
  @ApiResponse({ status: 200, description: 'Suggestions returned successfully' })
  @ApiResponse({ status: 400, description: 'Query is required' })
  async suggestMovies(
    @Query('query') query: string,
    @Query('limit') limit = '8',
  ): Promise<MovieSuggestion[]> {
    if (!query?.trim()) {
      throw new BadRequestException('Query is required');
    }

    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isNaN(parsedLimit) ? 8 : parsedLimit;
    return this.moviesService.suggestMovies(query, safeLimit);
  }

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve movie by title from DB, fallback to TMDB import' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'externalId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Movie resolved successfully' })
  @ApiResponse({ status: 400, description: 'Query is required' })
  @ApiResponse({ status: 404, description: 'Movie not found in DB and TMDB' })
  async resolveMovie(
    @Query('query') query: string,
    @Query('externalId') externalId?: string,
  ): Promise<MovieWithGenres> {
    if (!query?.trim() && !externalId?.trim()) {
      throw new BadRequestException('Query is required');
    }

    const movie = await this.moviesService.resolveMovieByQuery(query ?? '', externalId);
    return toMovieWithGenres(movie as MovieRow);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findOne(@Param('id') id: string): Promise<MovieWithGenres> {
    const movie = await this.moviesService.findOne(id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return toMovieWithGenres(movie as MovieRow);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a movie' })
  @ApiBody({ type: UpdateMovieDto })
  @ApiResponse({ status: 200, description: 'Movie updated successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  update(
    @Param('id') id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<Movie> {
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a movie' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  remove(@Param('id') id: string): Promise<Movie> {
    return this.moviesService.remove(id);
  }

  @Get('search/tmdb')
  @ApiOperation({ summary: 'Search movies in TMDB' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Movies found successfully' })
  async searchMovies(
    @Query('query') query: string,
    @Query('page') page = 1,
  ): Promise<Partial<Movie>[]> {
    const tmdbMovies = await this.moviesService.searchMovies(query, page);
    return this.moviesService.convertTmdbMoviesToMovies(tmdbMovies);
  }

  @Get('popular/tmdb')
  @ApiOperation({ summary: 'Get popular movies from TMDB' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Popular movies retrieved successfully' })
  async getPopularMovies(@Query('page') page = 1): Promise<Partial<Movie>[]> {
    const tmdbMovies = await this.moviesService.getPopularMovies(page);
    return this.moviesService.convertTmdbMoviesToMovies(tmdbMovies);
  }

  @Post('import/tmdb/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import a movie from TMDB by ID' })
  @ApiResponse({ status: 201, description: 'Movie imported successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found in TMDB' })
  async importMovieFromTmdb(@Param('id') id: string): Promise<Movie> {
    return this.moviesService.importMovieFromTmdb(+id);
  }
} 