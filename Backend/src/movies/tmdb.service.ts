import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department?: string;
}

export interface TmdbCredits {
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
}

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  credits?: TmdbCredits;
  genres?: Array<{ name: string }>;
}

export interface TmdbTvShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genres?: Array<{ name: string }>;
  credits?: TmdbCredits;
  created_by?: Array<{ id: number; name: string; profile_path: string | null }>;
}

export interface TmdbMultiMovieResult extends TmdbMovie {
  media_type: 'movie';
}

export interface TmdbMultiTvResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  media_type: 'tv';
  genre_ids?: number[];
}

export type TmdbMultiResult = TmdbMultiMovieResult | TmdbMultiTvResult;

interface TmdbMovieSearchResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

interface TmdbMultiSearchResponse {
  page: number;
  results: TmdbMultiResult[];
  total_pages: number;
  total_results: number;
}

@Injectable()
export class TmdbService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';
  private readonly isV3ApiKey: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!apiKey) {
      throw new Error('TMDB_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey.trim();
    this.isV3ApiKey = /^[a-f0-9]{32}$/i.test(this.apiKey);
  }

  private getRequestConfig(params: Record<string, string | number> = {}) {
    if (this.isV3ApiKey) {
      return {
        params: {
          ...params,
          api_key: this.apiKey,
        },
      };
    }

    return {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      params,
    };
  }

  async getPopularMovies(page = 1): Promise<TmdbMovie[]> {
    const response = await firstValueFrom(
      this.httpService.get<TmdbMovieSearchResponse>(`${this.baseUrl}/movie/popular`, {
        ...this.getRequestConfig({ page }),
      }),
    );
    return response.data.results;
  }

  private hasMeaningfulCredits(c?: TmdbCredits): boolean {
    return (c?.cast?.length ?? 0) > 0 || (c?.crew?.length ?? 0) > 0;
  }

  async getMovieDetails(movieId: number): Promise<TmdbMovie> {
    const response = await firstValueFrom(
      this.httpService.get<TmdbMovie>(`${this.baseUrl}/movie/${movieId}`, {
        ...this.getRequestConfig({
          append_to_response: 'credits',
        }),
      }),
    );
    const movie = response.data;
    if (this.hasMeaningfulCredits(movie.credits)) {
      return movie;
    }
    const creditsRes = await firstValueFrom(
      this.httpService.get<TmdbCredits>(`${this.baseUrl}/movie/${movieId}/credits`, {
        ...this.getRequestConfig(),
      }),
    );
    return { ...movie, credits: creditsRes.data };
  }

  async getTvDetails(tvId: number): Promise<TmdbTvShow> {
    const response = await firstValueFrom(
      this.httpService.get<TmdbTvShow>(`${this.baseUrl}/tv/${tvId}`, {
        ...this.getRequestConfig({
          append_to_response: 'credits',
        }),
      }),
    );
    const tv = response.data;
    if (this.hasMeaningfulCredits(tv.credits)) {
      return tv;
    }
    const creditsRes = await firstValueFrom(
      this.httpService.get<TmdbCredits>(`${this.baseUrl}/tv/${tvId}/credits`, {
        ...this.getRequestConfig(),
      }),
    );
    return { ...tv, credits: creditsRes.data };
  }

  async searchMovies(query: string, page = 1): Promise<TmdbMovie[]> {
    const response = await firstValueFrom(
      this.httpService.get<TmdbMovieSearchResponse>(`${this.baseUrl}/search/movie`, {
        ...this.getRequestConfig({ query, page }),
      }),
    );
    return response.data.results;
  }

  async searchMulti(query: string, page = 1): Promise<TmdbMultiResult[]> {
    const response = await firstValueFrom(
      this.httpService.get<TmdbMultiSearchResponse>(`${this.baseUrl}/search/multi`, {
        ...this.getRequestConfig({ query, page }),
      }),
    );
    return response.data.results.filter(
      (r): r is TmdbMultiResult =>
        r.media_type === 'movie' || r.media_type === 'tv',
    );
  }

  getPosterUrl(posterPath: string | null | undefined, size: ImageSize = 'w500'): string {
    if (!posterPath) return '';
    return `${this.imageBaseUrl}/${size}${posterPath}`;
  }

  getProfileUrl(profilePath: string | null | undefined, size: ImageSize = 'w185'): string {
    if (!profilePath) return '';
    return `${this.imageBaseUrl}/${size}${profilePath}`;
  }

  getOriginalPosterUrl(posterPath: string): string {
    return this.getPosterUrl(posterPath, 'original');
  }
}
