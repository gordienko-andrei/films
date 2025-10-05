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

  // --------- Embeddings & Similarities (content-based) ---------
  private readonly genreHashBuckets = 16;

  private hashStringToBucket(value: string, buckets: number): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0; // Convert to 32bit int
    }
    return Math.abs(hash) % buckets;
  }

  private splitGenres(genre?: string | null): string[] {
    return (genre ?? '')
      .split(',')
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);
  }

  private buildMovieVector(movie: Movie & { ratings?: Rating[] }): number[] {
    // Vector layout:
    // [0..15] genre hashed one-hot, [16] year normalized, [17] avg rating normalized
    const vectorSize = this.genreHashBuckets + 2;
    const vector = new Array<number>(vectorSize).fill(0);

    // Genres hashed one-hot
    const genres = this.splitGenres(movie.genre);
    for (const g of genres) {
      const idx = this.hashStringToBucket(g, this.genreHashBuckets);
      vector[idx] += 1;
    }
    // L2 normalize genre subvector if any signal
    const genreNorm = Math.sqrt(vector.slice(0, this.genreHashBuckets).reduce((s, v) => s + v * v, 0));
    if (genreNorm > 0) {
      for (let i = 0; i < this.genreHashBuckets; i++) {
        vector[i] = vector[i] / genreNorm;
      }
    }

    // Year normalized to ~[0,1] using 1900..currentYear
    const minYear = 1900;
    const maxYear = new Date().getFullYear();
    const year = Math.min(Math.max(movie.year, minYear), maxYear);
    vector[this.genreHashBuckets] = (year - minYear) / (maxYear - minYear);

    // Average rating normalized to [0,1] assuming 0..10 scale
    const ratings = movie.ratings ?? [];
    const avg = ratings.length ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length : 0;
    vector[this.genreHashBuckets + 1] = Math.min(Math.max(avg / 10, 0), 1);

    return vector;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < n; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom > 0 ? dot / denom : 0;
  }

  async upsertEmbedding(movieId: string): Promise<void> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: { ratings: true },
    });
    if (!movie) throw new NotFoundException('Movie not found');
    const vector = this.buildMovieVector(movie);
    await (this.prisma as any).movieEmbedding.upsert({
      where: { movieId },
      create: { movieId, vector },
      update: { vector },
    });
  }

  async rebuildSimilarFor(movieId: string, topK = 20): Promise<void> {
    // Ensure embedding exists for target
    await this.upsertEmbedding(movieId);
    const all = await (this.prisma as any).movieEmbedding.findMany();
    const target = all.find((m: { movieId: string }) => m.movieId === movieId);
    if (!target) return;

    const scored: { toId: string; score: number }[] = [];
    for (const m of all as Array<{ movieId: string; vector: number[] }>) {
      if (m.movieId === movieId) continue;
      const score = this.cosineSimilarity(target.vector as unknown as number[], m.vector as unknown as number[]);
      scored.push({ toId: m.movieId, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK);

    // Replace similars
    await this.prisma.$transaction([
      (this.prisma as any).movieSimilar.deleteMany({ where: { fromId: movieId } }),
      ...top.map((s: { toId: string; score: number }) => (this.prisma as any).movieSimilar.upsert({
        where: { fromId_toId: { fromId: movieId, toId: s.toId } },
        create: { fromId: movieId, toId: s.toId, score: s.score },
        update: { score: s.score },
      })),
    ]);
  }

  async rebuildAll(topK = 20): Promise<void> {
    // Build embeddings for all movies first
    const allIds = await this.prisma.movie.findMany({ select: { id: true } });
    for (const { id } of allIds) {
      await this.upsertEmbedding(id);
    }
    // Then rebuild similars using stored embeddings
    for (const { id } of allIds) {
      await this.rebuildSimilarFor(id, topK);
    }
  }

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
          where: { externalId: movie.id.toString() },
          create: {
            title: movie.title,
            description: movie.overview,
            year: new Date(movie.release_date).getFullYear(),
            director: 'Unknown',
            genre: 'Unknown',
            posterPath: movie.poster_path,
            externalId: movie.id.toString(),
          },
          update: {
            title: movie.title,
            description: movie.overview,
            year: new Date(movie.release_date).getFullYear(),
            posterPath: movie.poster_path,
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

  async getSimilarMovies(movieId: string, limit = 10): Promise<Movie[]> {
    // Try precomputed similars first
    const similars = await (this.prisma as any).movieSimilar.findMany({
      where: { fromId: movieId },
      orderBy: { score: 'desc' },
      take: limit,
    });

    if (similars.length > 0) {
      const ids = similars.map((s: { toId: string }) => s.toId);
      const movies = await this.prisma.movie.findMany({
        where: { id: { in: ids } },
      });
      // Preserve order by score
      const byId = new Map<string, Movie>(movies.map((m: Movie) => [m.id, m] as [string, Movie]));
      return ids
        .map((id: string) => byId.get(id))
        .filter((m: Movie | undefined): m is Movie => !!m);
    }

    // Fallback: lightweight content-based on the fly (if no precomputed data yet)
    await this.upsertEmbedding(movieId);
    const all = await this.prisma.movie.findMany({ include: { ratings: true } });
    const target = all.find((m) => m.id === movieId);
    if (!target) throw new NotFoundException('Movie not found');
    const vTarget = this.buildMovieVector(target);
    const scored: { m: Movie; score: number }[] = [];
    for (const m of all) {
      if (m.id === movieId) continue;
      const score = this.cosineSimilarity(vTarget, this.buildMovieVector(m));
      scored.push({ m, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.m);
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

  async addTagsToMovie(movieId: string, tagNames: string[]): Promise<Movie> {
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