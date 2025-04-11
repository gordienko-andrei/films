import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from './tmdb.service';
import { Movie, Rating, Prisma } from '@prisma/client';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

type MovieWithTags = Movie & {
  tags: (Prisma.MovieTagGetPayload<{
    include: { tag: true };
  }>)[];
};

type MovieWithRatingsAndTags = Movie & {
  ratings: Rating[];
  tags: (Prisma.MovieTagGetPayload<{
    include: { tag: true };
  }>)[];
};

type RatingWithMovie = Rating & {
  movie: MovieWithTags;
};

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
  ) {}

  async getPopularMovies(limit = 10): Promise<Movie[]> {
    const popularMovies = await this.tmdbService.getPopularMovies(limit);
    
    // Create or update popular collection
    const collection = await this.prisma.$transaction(async (prisma) => {
      const col = await prisma.collection.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          type: 'POPULAR',
          name: 'Popular Movies',
          description: 'Popular movies from TMDB',
        },
        update: {},
      });

      // Add movies to collection
      for (const movie of popularMovies) {
        const dbMovie = await prisma.movie.upsert({
          where: { id: movie.id },
          create: {
            id: movie.id,
            title: movie.title,
            description: movie.overview,
            year: new Date(movie.release_date).getFullYear(),
            director: 'Unknown',
            genre: 'Unknown',
            posterUrl: this.tmdbService.getPosterUrl(movie.poster_path),
          },
          update: {
            title: movie.title,
            description: movie.overview,
            year: new Date(movie.release_date).getFullYear(),
            posterUrl: this.tmdbService.getPosterUrl(movie.poster_path),
          },
        });

        await prisma.movieCollection.upsert({
          where: {
            movieId_collectionId: {
              movieId: dbMovie.id,
              collectionId: col.id,
            },
          },
          create: {
            movieId: dbMovie.id,
            collectionId: col.id,
          },
          update: {},
        });
      }

      return col;
    });

    return this.prisma.movie.findMany({
      where: {
        collections: {
          some: {
            collectionId: collection.id,
          },
        },
      },
      take: limit,
    });
  }

  async getSimilarMovies(movieId: number, limit = 10): Promise<Movie[]> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const tagIds = movie.tags.map((mt) => mt.tagId);

    return this.prisma.movie.findMany({
      where: {
        id: { not: movieId },
        tags: {
          some: {
            tagId: { in: tagIds },
          },
        },
      },
      include: {
        ratings: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: limit,
    });
  }

  async getUserBasedRecommendations(userId: number, limit = 10): Promise<Movie[]> {
    const userRatings = await this.prisma.rating.findMany({
      where: { userId },
      include: {
        movie: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    if (userRatings.length === 0) {
      return this.getPopularMovies(limit);
    }

    const ratedTagIds = new Set<number>();
    userRatings.forEach((rating) => {
      if (rating.movie) {
        rating.movie.tags.forEach((mt) => {
          ratedTagIds.add(mt.tagId);
        });
      }
    });

    return this.prisma.movie.findMany({
      where: {
        id: {
          notIn: userRatings.map((r) => r.movieId),
        },
        tags: {
          some: {
            tagId: {
              in: Array.from(ratedTagIds),
            },
          },
        },
      },
      include: {
        ratings: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: limit,
    });
  }

  async addTagsToMovie(movieId: number, tagNames: string[]): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const tags = await Promise.all(
      tagNames.map(async (name) =>
        this.prisma.$transaction(async (prisma) => {
          return prisma.tag.upsert({
            where: { name },
            create: { name },
            update: {},
          });
        }),
      ),
    );

    await Promise.all(
      tags.map(async (tag) =>
        this.prisma.$transaction(async (prisma) => {
          return prisma.movieTag.upsert({
            where: {
              movieId_tagId: {
                movieId,
                tagId: tag.id,
              },
            },
            create: {
              movieId,
              tagId: tag.id,
            },
            update: {},
          });
        }),
      ),
    );

    const updatedMovie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!updatedMovie) {
      throw new NotFoundException('Movie not found after update');
    }

    return updatedMovie;
  }
} 