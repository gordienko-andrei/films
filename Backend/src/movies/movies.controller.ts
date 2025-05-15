import {
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
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Movie } from '@prisma/client';

interface PaginatedMoviesResponse {
  movies: Movie[];
  total: number;
  page: number;
  limit: number;
}

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
      movies: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findOne(@Param('id') id: string): Promise<Movie> {
    const movie = await this.moviesService.findOne(id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import a movie from TMDB by ID' })
  @ApiResponse({ status: 201, description: 'Movie imported successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found in TMDB' })
  importMovieFromTmdb(@Param('id') id: string): Promise<Movie> {
    return this.moviesService.importMovieFromTmdb(+id);
  }
} 