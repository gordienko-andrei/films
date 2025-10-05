import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from './tmdb.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Prisma } from '@prisma/client';
import { Movie } from './interfaces/movie.interface';
import { HttpModule } from '@nestjs/axios';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  credits?: {
    crew: Array<{
      job: string;
      name: string;
    }>;
  };
  genres?: Array<{
    name: string;
  }>;
}

interface MovieFilters {
  genre?: string;
  year?: number;
  director?: string;
}

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    return this.prisma.movie.create({
      data: createMovieDto,
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    filters?: MovieFilters,
  ): Promise<{
    data: Movie[];
    meta: { total: number; page: number; limit: number; pages: number };
  }> {
    const where: Prisma.MovieWhereInput = {};
    if (filters) {
      if (filters.genre) {
        where.genre = filters.genre;
      }
      if (filters.year) {
        where.year = filters.year;
      }
      if (filters.director) {
        where.director = filters.director;
      }
    }

    const skip = (page - 1) * limit;
    const [total, movies] = await Promise.all([
      this.prisma.movie.count({ where }),
      this.prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data: movies,
      meta: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        ratings: true,
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    try {
      return await this.prisma.movie.update({
        where: { id },
        data: updateMovieDto,
      });
    } catch (error) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Movie> {
    try {
      return await this.prisma.movie.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
  }

  async searchMovies(query: string, page = 1): Promise<TmdbMovie[]> {
    return this.tmdbService.searchMovies(query, page);
  }

  async getPopularMovies(page = 1): Promise<TmdbMovie[]> {
    return this.tmdbService.getPopularMovies(page);
  }

  async importMovieFromTmdb(tmdbId: number): Promise<Movie> {
    const tmdbMovie = await this.tmdbService.getMovieDetails(tmdbId);
    const director = tmdbMovie.credits?.crew.find(c => c.job === 'Director')?.name || 'Unknown';
    const genre = tmdbMovie.genres?.[0]?.name || 'Unknown';

    return this.create({
      title: tmdbMovie.title,
      description: tmdbMovie.overview,
      year: new Date(tmdbMovie.release_date).getFullYear(),
      director,
      genre,
      posterPath: tmdbMovie.poster_path || undefined,
      externalId: tmdbId.toString(),
    });
  }

  convertTmdbMoviesToMovies(tmdbMovies: TmdbMovie[]): Partial<Movie>[] {
    return tmdbMovies.map(tmdbMovie => ({
      externalId: tmdbMovie.id.toString(),
      title: tmdbMovie.title,
      description: tmdbMovie.overview,
      year: new Date(tmdbMovie.release_date).getFullYear(),
      director: tmdbMovie.credits?.crew.find(c => c.job === 'Director')?.name || 'Unknown',
      genre: tmdbMovie.genres?.[0]?.name || 'Unknown',
      posterPath: tmdbMovie.poster_path || null,
      trailerUrl: null,
    }));
  }

  async getRecentlyDiscussed(): Promise<Movie[]> {
    return this.prisma.movie.findMany({
      where: {
        reviews: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days
            }
          }
        }
      },
      include: {
        reviews: true,
        ratings: true
      },
      orderBy: {
        reviews: {
          _count: 'desc'
        }
      },
      take: 20
    });
  }

  async getNewMovies(): Promise<Movie[]> {
    return this.prisma.movie.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
  }

  async getTrending(): Promise<Movie[]> {
    const movies = await this.prisma.movie.findMany({
      include: {
        ratings: true
      },
      take: 20
    });

    return movies.sort((a, b) => {
      const avgRatingA = a.ratings.reduce((sum, r) => sum + r.score, 0) / (a.ratings.length || 1);
      const avgRatingB = b.ratings.reduce((sum, r) => sum + r.score, 0) / (b.ratings.length || 1);
      return avgRatingB - avgRatingA;
    });
  }

  async getPopular(): Promise<Movie[]> {
    const movies = await this.prisma.movie.findMany({
      include: {
        ratings: true,
        reviews: true
      },
      take: 20
    });

    return movies.sort((a, b) => {
      const scoreA = a.ratings.length + a.reviews.length;
      const scoreB = b.ratings.length + b.reviews.length;
      return scoreB - scoreA;
    });
  }
} 