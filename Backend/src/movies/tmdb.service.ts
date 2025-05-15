import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
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

interface TmdbResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

@Injectable()
export class TmdbService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!apiKey) {
      throw new Error('TMDB_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getPopularMovies(page = 1): Promise<TmdbMovie[]> {
    const response = await firstValueFrom(
      this.httpService.get<TmdbResponse>(`${this.baseUrl}/movie/popular`, {
        headers: this.getHeaders(),
        params: { page },
      }),
    );
    return response.data.results;
  }

  async getMovieDetails(movieId: number): Promise<TmdbMovie> {
    const response = await firstValueFrom(
      this.httpService.get<TmdbMovie>(`${this.baseUrl}/movie/${movieId}`, {
        headers: this.getHeaders(),
        params: {
          append_to_response: 'credits,genres',
        },
      }),
    );
    return response.data;
  }

  async searchMovies(query: string, page = 1): Promise<TmdbMovie[]> {
    const response = await firstValueFrom(
      this.httpService.get<TmdbResponse>(`${this.baseUrl}/search/movie`, {
        headers: this.getHeaders(),
        params: { query, page },
      }),
    );
    return response.data.results;
  }

  getPosterUrl(posterPath: string, size: ImageSize = 'w500'): string {
    if (!posterPath) return '';
    return `${this.imageBaseUrl}/${size}${posterPath}`;
  }

  getOriginalPosterUrl(posterPath: string): string {
    return this.getPosterUrl(posterPath, 'original');
  }
} 