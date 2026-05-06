import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsService } from './recommendations.service';
import { TmdbMovie, TmdbMultiResult, TmdbService, TmdbTvShow } from './tmdb.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Prisma } from '@prisma/client';
import { Movie } from './interfaces/movie.interface';

interface MovieFilters {
  genre?: string;
  year?: number;
  director?: string;
}

export interface MoodPick {
  slug: string;
  name: string;
  emoji: string;
  movies: Movie[];
}

export interface GenrePick {
  genre: string;
  movies: Movie[];
}

export interface MovieSuggestion {
  id?: string;
  externalId: string | null;
  mediaType: 'movie' | 'tv';
  title: string;
  year: number;
  posterPath: string | null;
  posterUrl: string | null;
  inDatabase: boolean;
}

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
    private readonly recommendationsService: RecommendationsService,
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
      data: movies.map((movie) => this.withPosterUrl(movie)),
      meta: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async findOne(id: string): Promise<Movie> {
    const include: Prisma.MovieInclude = { ratings: true };
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include,
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return this.ensureCreditsFromTmdbIfMissing(movie, include);
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

  async suggestMovies(query: string, limit = 8): Promise<MovieSuggestion[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      throw new BadRequestException('Query is required');
    }

    const safeLimit = Math.min(Math.max(limit, 1), 20);

    const dbMovies = await this.prisma.movie.findMany({
      where: {
        title: { contains: normalizedQuery, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    const suggestions = new Map<string, MovieSuggestion>();

    for (const dbMovie of dbMovies) {
      const movieWithPosterUrl = this.withPosterUrl(dbMovie);
      const rowMedia = (dbMovie as { mediaType?: string }).mediaType;
      const mediaType = rowMedia === 'tv' ? 'tv' : 'movie';
      const key = dbMovie.externalId ?? `db:${dbMovie.id}`;
      suggestions.set(key, {
        id: movieWithPosterUrl.id,
        externalId: movieWithPosterUrl.externalId,
        mediaType,
        title: movieWithPosterUrl.title,
        year: movieWithPosterUrl.year,
        posterPath: movieWithPosterUrl.posterPath,
        posterUrl: movieWithPosterUrl.posterUrl,
        inDatabase: true,
      });
    }

    if (suggestions.size >= safeLimit) {
      return Array.from(suggestions.values()).slice(0, safeLimit);
    }

    const tmdbMulti = await this.tmdbService.searchMulti(normalizedQuery, 1);
    for (const item of tmdbMulti) {
      if (suggestions.size >= safeLimit) {
        break;
      }

      if (item.media_type === 'movie') {
        const key = `m:${item.id}`;
        if (suggestions.has(item.id.toString()) || suggestions.has(key)) {
          continue;
        }
        const year = Number.isNaN(new Date(item.release_date).getFullYear())
          ? new Date().getFullYear()
          : new Date(item.release_date).getFullYear();
        suggestions.set(key, {
          externalId: item.id.toString(),
          mediaType: 'movie',
          title: item.title,
          year,
          posterPath: item.poster_path || null,
          posterUrl: item.poster_path ? this.tmdbService.getPosterUrl(item.poster_path) : null,
          inDatabase: false,
        });
      } else {
        const ext = `tv-${item.id}`;
        const key = `tv:${item.id}`;
        if (suggestions.has(ext) || suggestions.has(key)) {
          continue;
        }
        const year = Number.isNaN(new Date(item.first_air_date).getFullYear())
          ? new Date().getFullYear()
          : new Date(item.first_air_date).getFullYear();
        suggestions.set(key, {
          externalId: ext,
          mediaType: 'tv',
          title: item.name,
          year,
          posterPath: item.poster_path || null,
          posterUrl: item.poster_path ? this.tmdbService.getPosterUrl(item.poster_path) : null,
          inDatabase: false,
        });
      }
    }

    return Array.from(suggestions.values()).slice(0, safeLimit);
  }

  async resolveMovieByQuery(query: string, externalId?: string): Promise<Movie> {
    const resolved = await this.doResolveMovieByQuery(query, externalId);
    return this.ensureCreditsFromTmdbIfMissing(resolved);
  }

  private async doResolveMovieByQuery(query: string, externalId?: string): Promise<Movie> {
    const normalizedExternalId = externalId?.trim();
    if (normalizedExternalId) {
      const movieByExternalId = await this.prisma.movie.findUnique({
        where: { externalId: normalizedExternalId },
      });
      if (movieByExternalId) {
        return this.withPosterUrl(movieByExternalId);
      }

      if (normalizedExternalId.startsWith('tv-')) {
        const tvNum = Number.parseInt(normalizedExternalId.slice(3), 10);
        if (!Number.isNaN(tvNum)) {
          return this.importTvFromTmdb(tvNum);
        }
      }

      const tmdbId = Number.parseInt(normalizedExternalId, 10);
      if (!Number.isNaN(tmdbId)) {
        return this.importMovieFromTmdb(tmdbId);
      }
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      throw new BadRequestException('Query is required');
    }

    const localMovie = await this.prisma.movie.findFirst({
      where: {
        OR: [
          { title: { equals: normalizedQuery, mode: 'insensitive' } },
          { title: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (localMovie) {
      return this.withPosterUrl(localMovie);
    }

    const multi = await this.tmdbService.searchMulti(normalizedQuery, 1);
    if (multi.length === 0) {
      throw new NotFoundException(`Movie with query "${normalizedQuery}" not found`);
    }

    const q = normalizedQuery.toLowerCase();
    const exactMovie = multi.find(
      (r): r is Extract<TmdbMultiResult, { media_type: 'movie' }> =>
        r.media_type === 'movie' && r.title.trim().toLowerCase() === q,
    );
    const exactTv = multi.find(
      (r): r is Extract<TmdbMultiResult, { media_type: 'tv' }> =>
        r.media_type === 'tv' && r.name.trim().toLowerCase() === q,
    );
    const candidate = exactMovie ?? exactTv ?? multi[0];

    if (candidate.media_type === 'movie') {
      return this.importMovieFromTmdb(candidate.id);
    }
    return this.importTvFromTmdb(candidate.id);
  }

  /**
   * Если в БД creditsJson пустой, но есть TMDB externalId — подтягиваем credits и сохраняем.
   */
  private async ensureCreditsFromTmdbIfMissing<M extends { id: string; externalId?: string | null; creditsJson?: Prisma.JsonValue | null }>(
    movie: M,
    include?: Prisma.MovieInclude,
  ): Promise<M> {
    if (movie.creditsJson != null) {
      return this.withPosterUrl(movie as unknown as Movie) as unknown as M;
    }
    const ext = movie.externalId?.trim();
    if (!ext) {
      return this.withPosterUrl(movie as unknown as Movie) as unknown as M;
    }
    try {
      let creditsJson: Prisma.InputJsonValue;
      if (ext.startsWith('tv-')) {
        const n = Number.parseInt(ext.slice(3), 10);
        if (Number.isNaN(n)) {
          return this.withPosterUrl(movie as unknown as Movie) as unknown as M;
        }
        const tv = await this.tmdbService.getTvDetails(n);
        creditsJson = this.buildCreditsSnapshotFromTmdb(tv);
      } else {
        const n = Number.parseInt(ext, 10);
        if (Number.isNaN(n)) {
          return this.withPosterUrl(movie as unknown as Movie) as unknown as M;
        }
        const tmdbMovie = await this.tmdbService.getMovieDetails(n);
        creditsJson = this.buildCreditsSnapshotFromTmdb(tmdbMovie);
      }
      await this.prisma.movie.update({
        where: { id: movie.id },
        data: { creditsJson } as Prisma.MovieUpdateInput,
      });
      const fresh = await this.prisma.movie.findUnique({
        where: { id: movie.id },
        include: include ?? undefined,
      });
      if (!fresh) {
        return this.withPosterUrl(movie as unknown as Movie) as unknown as M;
      }
      return this.withPosterUrl(fresh as Movie) as unknown as M;
    } catch {
      return this.withPosterUrl(movie as unknown as Movie) as unknown as M;
    }
  }

  async importMovieFromTmdb(tmdbId: number): Promise<Movie> {
    const externalId = tmdbId.toString();
    const existingByExternalId = await this.prisma.movie.findUnique({
      where: { externalId },
    });
    if (existingByExternalId) {
      return this.ensureCreditsFromTmdbIfMissing(existingByExternalId as Movie);
    }

    const tmdbMovie = await this.tmdbService.getMovieDetails(tmdbId);
    const director = tmdbMovie.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown';
    const genre = tmdbMovie.genres?.[0]?.name || 'Unknown';
    const posterPath = tmdbMovie.poster_path || undefined;
    const posterUrl = posterPath ? this.tmdbService.getPosterUrl(posterPath) : undefined;
    const year = Number.isNaN(new Date(tmdbMovie.release_date).getFullYear())
      ? new Date().getFullYear()
      : new Date(tmdbMovie.release_date).getFullYear();
    const creditsJson = this.buildCreditsSnapshotFromTmdb(tmdbMovie);

    const existingByTitleAndYear = await this.prisma.movie.findFirst({
      where: {
        title: { equals: tmdbMovie.title, mode: 'insensitive' },
        year,
        mediaType: 'movie',
      } as Prisma.MovieWhereInput,
    });

    if (existingByTitleAndYear) {
      const updated = await this.prisma.movie.update({
        where: { id: existingByTitleAndYear.id },
        data: {
          description: tmdbMovie.overview || existingByTitleAndYear.description,
          director,
          genre,
          posterPath: posterPath || existingByTitleAndYear.posterPath || undefined,
          posterUrl: posterUrl || existingByTitleAndYear.posterUrl || undefined,
          externalId,
          mediaType: 'movie',
          creditsJson,
        } as Prisma.MovieUpdateInput,
      });
      return this.withPosterUrl(updated as Movie);
    }

    const created = await this.prisma.movie.create({
      data: {
        title: tmdbMovie.title,
        description: tmdbMovie.overview || 'No description available',
        year,
        director,
        genre,
        posterPath,
        posterUrl,
        externalId,
        mediaType: 'movie',
        creditsJson,
      } as Prisma.MovieCreateInput,
    });
    void this.recommendationsService.rebuildSimilarFor(created.id, 20);
    return this.withPosterUrl(created as Movie);
  }

  async importTvFromTmdb(tmdbTvId: number): Promise<Movie> {
    const externalId = `tv-${tmdbTvId}`;
    const existingByExternalId = await this.prisma.movie.findUnique({
      where: { externalId },
    });
    if (existingByExternalId) {
      return this.ensureCreditsFromTmdbIfMissing(existingByExternalId as Movie);
    }

    const tv = await this.tmdbService.getTvDetails(tmdbTvId);
    const year = Number.isNaN(new Date(tv.first_air_date).getFullYear())
      ? new Date().getFullYear()
      : new Date(tv.first_air_date).getFullYear();
    const director =
      tv.created_by?.[0]?.name ??
      tv.credits?.crew?.find(c => c.job === 'Executive Producer')?.name ??
      tv.credits?.crew?.find(c => c.job === 'Director')?.name ??
      'Unknown';
    const genre = tv.genres?.[0]?.name ?? 'Unknown';
    const posterPath = tv.poster_path || undefined;
    const posterUrl = posterPath ? this.tmdbService.getPosterUrl(posterPath) : undefined;
    const creditsJson = this.buildCreditsSnapshotFromTmdb(tv);

    const existingByTitleAndYear = await this.prisma.movie.findFirst({
      where: {
        title: { equals: tv.name, mode: 'insensitive' },
        year,
        mediaType: 'tv',
      } as Prisma.MovieWhereInput,
    });

    if (existingByTitleAndYear) {
      const updated = await this.prisma.movie.update({
        where: { id: existingByTitleAndYear.id },
        data: {
          description: tv.overview || existingByTitleAndYear.description,
          director,
          genre,
          posterPath: posterPath || existingByTitleAndYear.posterPath || undefined,
          posterUrl: posterUrl || existingByTitleAndYear.posterUrl || undefined,
          externalId,
          mediaType: 'tv',
          creditsJson,
        } as Prisma.MovieUpdateInput,
      });
      return this.withPosterUrl(updated as Movie);
    }

    const created = await this.prisma.movie.create({
      data: {
        title: tv.name,
        description: tv.overview || 'No description available',
        year,
        director,
        genre,
        posterPath,
        posterUrl,
        externalId,
        mediaType: 'tv',
        creditsJson,
      } as Prisma.MovieCreateInput,
    });
    void this.recommendationsService.rebuildSimilarFor(created.id, 20);
    return this.withPosterUrl(created as Movie);
  }

  private buildCreditsSnapshotFromTmdb(
    tmdb: TmdbMovie | TmdbTvShow,
  ): Prisma.InputJsonValue {
    const cast = (tmdb.credits?.cast ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 15)
      .map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profileUrl: this.tmdbService.getProfileUrl(c.profile_path, 'w185'),
      }));

    const crewJobs = new Set([
      'Director',
      'Writer',
      'Screenplay',
      'Executive Producer',
      'Producer',
      'Creator',
    ]);
    const crew = (tmdb.credits?.crew ?? [])
      .filter((c) => crewJobs.has(c.job))
      .slice(0, 16)
      .map((c) => ({ name: c.name, job: c.job }));

    const payload: Record<string, unknown> = { cast, crew };

    if ('created_by' in tmdb && tmdb.created_by?.length) {
      payload.createdBy = tmdb.created_by.map((p) => ({
        id: p.id,
        name: p.name,
        profileUrl: this.tmdbService.getProfileUrl(p.profile_path, 'w185'),
      }));
    }

    return payload as Prisma.InputJsonValue;
  }

  convertTmdbMoviesToMovies(tmdbMovies: TmdbMovie[]): Partial<Movie>[] {
    return tmdbMovies.map(tmdbMovie => ({
      externalId: tmdbMovie.id.toString(),
      title: tmdbMovie.title,
      description: tmdbMovie.overview,
      year: new Date(tmdbMovie.release_date).getFullYear(),
      director: tmdbMovie.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown',
      genre: tmdbMovie.genres?.[0]?.name || 'Unknown',
      posterPath: tmdbMovie.poster_path || null,
      posterUrl: tmdbMovie.poster_path ? this.tmdbService.getPosterUrl(tmdbMovie.poster_path) : null,
      trailerUrl: null,
    }));
  }

  private withPosterUrl(movie: Movie): Movie {
    if (movie.posterUrl || !movie.posterPath) {
      return movie;
    }

    return {
      ...movie,
      posterUrl: this.tmdbService.getPosterUrl(movie.posterPath),
    };
  }

  private normalizeLimit(limit: number, fallback = 20, max = 50): number {
    if (!Number.isFinite(limit) || limit <= 0) {
      return fallback;
    }
    return Math.min(Math.floor(limit), max);
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
    const limit = 20;
    const currentYear = new Date().getFullYear();
    const minReleaseYear = currentYear - 2;
    const recentReviewDays = 30;

    const since = new Date();
    since.setDate(since.getDate() - recentReviewDays);

    const candidates = await this.prisma.movie.findMany({
      where: {
        year: { gte: minReleaseYear },
      },
      include: {
        reviews: {
          where: { createdAt: { gte: since } },
          select: { id: true },
        },
      },
      take: 400,
    });

    const scored = candidates.map((m) => {
      const recentReviews = m.reviews.length;
      const score = recentReviews * 1000 + m.year;
      return { m, score, recentReviews };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.recentReviews - a.recentReviews;
    });

    return scored.slice(0, limit).map(({ m }) => {
      const { reviews: _r, ...rest } = m;
      return this.withPosterUrl(rest as Movie);
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

  async getBecauseYouLiked(userId: number, limit = 20): Promise<Movie[]> {
    const safeLimit = this.normalizeLimit(limit);

    const [likedRatings, likedReviews, likedEmotions] = await Promise.all([
      this.prisma.rating.findMany({
        where: { userId, score: { gte: 8 } },
        select: { movieId: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.review.findMany({
        where: { userId, rating: { gte: 8 } },
        select: { movieId: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.userEmotion.findMany({
        where: { userId },
        select: { filmId: true, emotionId: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const likedMovieIds = new Set<string>([
      ...likedRatings.map((r) => r.movieId),
      ...likedReviews.map((r) => r.movieId),
      ...likedEmotions.map((e) => e.filmId),
    ]);

    if (likedMovieIds.size === 0) {
      return this.getTrending();
    }

    const interactedMovieIds = new Set<string>(likedMovieIds);
    const [allUserRatings, allUserReviews] = await Promise.all([
      this.prisma.rating.findMany({ where: { userId }, select: { movieId: true } }),
      this.prisma.review.findMany({ where: { userId }, select: { movieId: true } }),
    ]);
    allUserRatings.forEach((r) => interactedMovieIds.add(r.movieId));
    allUserReviews.forEach((r) => interactedMovieIds.add(r.movieId));

    const likedEmotionIds = Array.from(new Set(likedEmotions.map((e) => e.emotionId)));
    const likedMovies = await this.prisma.movie.findMany({
      where: { id: { in: Array.from(likedMovieIds) } },
      select: { id: true, genre: true, director: true },
    });
    const likedGenres = Array.from(new Set(likedMovies.map((m) => m.genre).filter(Boolean)));
    const likedDirectors = Array.from(new Set(likedMovies.map((m) => m.director).filter(Boolean)));

    const candidates = await this.prisma.movie.findMany({
      where: {
        id: { notIn: Array.from(interactedMovieIds) },
        OR: [
          likedGenres.length > 0 ? { genre: { in: likedGenres } } : undefined,
          likedDirectors.length > 0 ? { director: { in: likedDirectors } } : undefined,
          likedEmotionIds.length > 0
            ? { filmEmotions: { some: { emotionId: { in: likedEmotionIds }, count: { gt: 0 } } } }
            : undefined,
        ].filter(Boolean) as Prisma.MovieWhereInput[],
      },
      include: {
        filmEmotions: true,
      },
      take: 300,
    });

    if (candidates.length === 0) {
      return this.getTrending();
    }

    const candidateIds = candidates.map((m) => m.id);
    const [ratingStats, reviewStats] = await Promise.all([
      this.prisma.rating.groupBy({
        by: ['movieId'],
        where: { movieId: { in: candidateIds } },
        _avg: { score: true },
        _count: { _all: true },
      }),
      this.prisma.review.groupBy({
        by: ['movieId'],
        where: { movieId: { in: candidateIds } },
        _count: { _all: true },
      }),
    ]);

    const ratingMap = new Map(ratingStats.map((s) => [s.movieId, s]));
    const reviewMap = new Map(reviewStats.map((s) => [s.movieId, s]));

    const scored = candidates.map((movie) => {
      const emotionOverlap = movie.filmEmotions.filter((fe) => likedEmotionIds.includes(fe.emotionId));
      const emotionScore = emotionOverlap.reduce((sum, row) => sum + row.count, 0);
      const genreScore = likedGenres.includes(movie.genre) ? 2 : 0;
      const directorScore = likedDirectors.includes(movie.director) ? 1.5 : 0;
      const rating = ratingMap.get(movie.id);
      const avgRating = rating?._avg.score ?? 0;
      const ratingCount = rating?._count._all ?? 0;
      const reviewCount = reviewMap.get(movie.id)?._count._all ?? 0;

      const score =
        genreScore +
        directorScore +
        emotionScore * 0.15 +
        avgRating * 0.7 +
        Math.log1p(ratingCount + reviewCount);

      return { movie, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit)
      .map(({ movie }) => this.withPosterUrl(movie as Movie));
  }

  async getTopRatedThisWeek(limit = 20, days = 7): Promise<Movie[]> {
    const safeLimit = this.normalizeLimit(limit);
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 30);
    const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const [ratingStats, reviewStats] = await Promise.all([
      this.prisma.rating.groupBy({
        by: ['movieId'],
        where: { createdAt: { gte: since } },
        _avg: { score: true },
        _count: { _all: true },
      }),
      this.prisma.review.groupBy({
        by: ['movieId'],
        where: { createdAt: { gte: since } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const statsMap = new Map<
      string,
      { ratingAvg: number; ratingCount: number; reviewAvg: number; reviewCount: number }
    >();

    for (const r of ratingStats) {
      statsMap.set(r.movieId, {
        ratingAvg: r._avg.score ?? 0,
        ratingCount: r._count._all,
        reviewAvg: 0,
        reviewCount: 0,
      });
    }
    for (const r of reviewStats) {
      const curr = statsMap.get(r.movieId) ?? {
        ratingAvg: 0,
        ratingCount: 0,
        reviewAvg: 0,
        reviewCount: 0,
      };
      curr.reviewAvg = r._avg.rating ?? 0;
      curr.reviewCount = r._count._all;
      statsMap.set(r.movieId, curr);
    }

    const rankedIds = Array.from(statsMap.entries())
      .map(([movieId, s]) => {
        const weightedAvg = s.ratingAvg * 0.6 + s.reviewAvg * 0.4;
        const activityBoost = Math.log1p(s.ratingCount + s.reviewCount);
        return { movieId, score: weightedAvg + activityBoost };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit)
      .map((x) => x.movieId);

    if (rankedIds.length === 0) {
      return [];
    }

    const movies = await this.prisma.movie.findMany({ where: { id: { in: rankedIds } } });
    const movieMap = new Map(movies.map((m) => [m.id, m]));
    return rankedIds
      .map((id) => movieMap.get(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => this.withPosterUrl(m as Movie));
  }

  async getMostDiscussed(limit = 20, days = 7): Promise<Movie[]> {
    const safeLimit = this.normalizeLimit(limit);
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 30);
    const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const grouped = await this.prisma.review.groupBy({
      by: ['movieId'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { movieId: 'desc' } },
      take: safeLimit,
    });

    const ids = grouped.map((g) => g.movieId);
    if (ids.length === 0) {
      return [];
    }

    const movies = await this.prisma.movie.findMany({ where: { id: { in: ids } } });
    const map = new Map(movies.map((m) => [m.id, m]));
    return ids
      .map((id) => map.get(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => this.withPosterUrl(m as Movie));
  }

  async getMoodPicks(limitPerMood = 12, moods?: string[]): Promise<MoodPick[]> {
    const safeLimit = this.normalizeLimit(limitPerMood, 12, 24);

    const filterSlugs = (moods ?? [])
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);

    const moodEmotions = await this.prisma.emotion.findMany({
      where: filterSlugs.length ? { slug: { in: filterSlugs } } : undefined,
      take: filterSlugs.length ? filterSlugs.length : 5,
      orderBy: { id: 'asc' },
    });

    if (moodEmotions.length === 0) {
      return [];
    }

    const picks: MoodPick[] = [];
    for (const mood of moodEmotions) {
      const filmEmotions = await this.prisma.filmEmotion.findMany({
        where: { emotionId: mood.id, count: { gt: 0 } },
        orderBy: { count: 'desc' },
        take: safeLimit,
        include: { film: true },
      });

      picks.push({
        slug: mood.slug,
        name: mood.name,
        emoji: mood.emoji,
        movies: filmEmotions.map((row) => this.withPosterUrl(row.film as Movie)),
      });
    }

    return picks;
  }

  async getHiddenGems(limit = 20): Promise<Movie[]> {
    const safeLimit = this.normalizeLimit(limit);
    const [ratingStats, reviewStats] = await Promise.all([
      this.prisma.rating.groupBy({
        by: ['movieId'],
        _avg: { score: true },
        _count: { _all: true },
      }),
      this.prisma.review.groupBy({
        by: ['movieId'],
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const statMap = new Map<
      string,
      { ratingAvg: number; ratingCount: number; reviewAvg: number; reviewCount: number }
    >();
    for (const r of ratingStats) {
      statMap.set(r.movieId, {
        ratingAvg: r._avg.score ?? 0,
        ratingCount: r._count._all,
        reviewAvg: 0,
        reviewCount: 0,
      });
    }
    for (const r of reviewStats) {
      const prev = statMap.get(r.movieId) ?? {
        ratingAvg: 0,
        ratingCount: 0,
        reviewAvg: 0,
        reviewCount: 0,
      };
      prev.reviewAvg = r._avg.rating ?? 0;
      prev.reviewCount = r._count._all;
      statMap.set(r.movieId, prev);
    }

    const hiddenGemIds = Array.from(statMap.entries())
      .map(([movieId, s]) => {
        const votes = s.ratingCount + s.reviewCount;
        const weightedAvg = s.ratingAvg * 0.6 + s.reviewAvg * 0.4;
        return { movieId, votes, weightedAvg };
      })
      .filter((s) => s.votes >= 2 && s.votes <= 12 && s.weightedAvg >= 7.5)
      .sort((a, b) => {
        if (b.weightedAvg !== a.weightedAvg) {
          return b.weightedAvg - a.weightedAvg;
        }
        return a.votes - b.votes;
      })
      .slice(0, safeLimit)
      .map((s) => s.movieId);

    if (hiddenGemIds.length === 0) {
      return [];
    }

    const movies = await this.prisma.movie.findMany({ where: { id: { in: hiddenGemIds } } });
    const map = new Map(movies.map((m) => [m.id, m]));
    return hiddenGemIds
      .map((id) => map.get(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => this.withPosterUrl(m as Movie));
  }

  /**
   * Несколько подборок: топ жанров по числу фильмов в БД, внутри каждого — популярные по активности и среднему рейтингу.
   */
  async getGenreSpotlights(sections = 8, limitPerGenre = 12): Promise<GenrePick[]> {
    const safeSections = Math.min(Math.max(Math.floor(sections), 3), 16);
    const safeLimit = this.normalizeLimit(limitPerGenre, 12, 30);

    const grouped = await this.prisma.movie.groupBy({
      by: ['genre'],
      where: {
        genre: {
          notIn: ['', 'Unknown', 'unknown'],
        },
      },
      _count: { genre: true },
      orderBy: { _count: { genre: 'desc' } },
      take: safeSections,
    });

    if (grouped.length === 0) {
      return [];
    }

    const topGenres = grouped.map((g) => g.genre).filter(Boolean);
    const allInGenres = await this.prisma.movie.findMany({
      where: { genre: { in: topGenres } },
      include: {
        ratings: true,
        reviews: { select: { id: true } },
      },
    });

    const byGenre = new Map<string, typeof allInGenres>();
    for (const m of allInGenres) {
      const list = byGenre.get(m.genre) ?? [];
      list.push(m);
      byGenre.set(m.genre, list);
    }

    const sortGenreMovies = (list: typeof allInGenres) =>
      [...list].sort((a, b) => {
        const hotA = a.ratings.length + a.reviews.length;
        const hotB = b.ratings.length + b.reviews.length;
        if (hotB !== hotA) {
          return hotB - hotA;
        }
        const avgA = a.ratings.reduce((s, r) => s + r.score, 0) / (a.ratings.length || 1);
        const avgB = b.ratings.reduce((s, r) => s + r.score, 0) / (b.ratings.length || 1);
        return avgB - avgA;
      });

    const picks: GenrePick[] = [];
    for (const genre of topGenres) {
      const list = byGenre.get(genre) ?? [];
      const sorted = sortGenreMovies(list)
        .slice(0, safeLimit)
        .map((row) => {
          const { ratings, reviews, ...rest } = row;
          return this.withPosterUrl(rest as Movie);
        });
      if (sorted.length > 0) {
        picks.push({ genre, movies: sorted });
      }
    }

    return picks;
  }

  async getMoviesByGenre(genre: string, limit = 20): Promise<Movie[]> {
    const g = genre.trim();
    if (!g) {
      return [];
    }
    const safeLimit = this.normalizeLimit(limit);

    const movies = await this.prisma.movie.findMany({
      where: { genre: { equals: g, mode: 'insensitive' } },
      include: {
        ratings: true,
        reviews: { select: { id: true } },
      },
      take: 250,
    });

    const sorted = [...movies].sort((a, b) => {
      const hotA = a.ratings.length + a.reviews.length;
      const hotB = b.ratings.length + b.reviews.length;
      if (hotB !== hotA) {
        return hotB - hotA;
      }
      const avgA = a.ratings.reduce((s, r) => s + r.score, 0) / (a.ratings.length || 1);
      const avgB = b.ratings.reduce((s, r) => s + r.score, 0) / (b.ratings.length || 1);
      return avgB - avgA;
    });

    return sorted.slice(0, safeLimit).map((row) => {
      const { ratings, reviews, ...rest } = row;
      return this.withPosterUrl(rest as Movie);
    });
  }
} 