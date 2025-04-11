import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../movies/tmdb.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseSeeder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
  ) {}

  async seed() {
    console.log('Starting database seeding...');

    // Create initial collections
    const collections = await this.createInitialCollections();

    // Get popular movies from TMDB
    const popularMovies = await this.tmdbService.getPopularMovies(20);
    console.log(`Fetched ${popularMovies.length} popular movies from TMDB`);

    // Process and save movies
    for (const movie of popularMovies) {
      await this.processMovie(movie, collections.popular.id);
    }

    console.log('Database seeding completed!');
  }

  private async createInitialCollections() {
    const collections = {
      popular: await this.prisma.collection.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          name: 'Popular Movies',
          description: 'Most popular movies from TMDB',
          type: 'POPULAR',
        },
        update: {},
      }),
      trending: await this.prisma.collection.upsert({
        where: { id: 2 },
        create: {
          id: 2,
          name: 'Trending Movies',
          description: 'Currently trending movies',
          type: 'TRENDING',
        },
        update: {},
      }),
    };

    console.log('Created initial collections');
    return collections;
  }

  private async processMovie(movie: any, collectionId: number) {
    // Create or update movie
    const dbMovie = await this.prisma.movie.upsert({
      where: { id: movie.id },
      create: {
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        year: new Date(movie.release_date).getFullYear(),
        director: 'Unknown', // We'll update this later with credits data
        genre: movie.genres?.[0]?.name || 'Unknown',
        posterUrl: this.tmdbService.getPosterUrl(movie.poster_path),
      },
      update: {
        title: movie.title,
        description: movie.overview,
        year: new Date(movie.release_date).getFullYear(),
        genre: movie.genres?.[0]?.name || 'Unknown',
        posterUrl: this.tmdbService.getPosterUrl(movie.poster_path),
      },
    });

    // Add movie to collection
    await this.prisma.movieCollection.upsert({
      where: {
        movieId_collectionId: {
          movieId: dbMovie.id,
          collectionId,
        },
      },
      create: {
        movieId: dbMovie.id,
        collectionId,
      },
      update: {},
    });

    // Process genres as tags
    if (movie.genres) {
      for (const genre of movie.genres) {
        await this.prisma.$transaction(async (prisma) => {
          const tag = await prisma.tag.upsert({
            where: { name: genre.name },
            create: { name: genre.name },
            update: {},
          });

          await prisma.movieTag.upsert({
            where: {
              movieId_tagId: {
                movieId: dbMovie.id,
                tagId: tag.id,
              },
            },
            create: {
              movieId: dbMovie.id,
              tagId: tag.id,
            },
            update: {},
          });
        });
      }
    }

    console.log(`Processed movie: ${movie.title}`);
  }
} 