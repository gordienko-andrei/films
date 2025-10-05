import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface YouTubeError {
  message?: string;
  response?: {
    data?: any;
  };
}

@Injectable()
export class YoutubeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  async findMovieTrailer(movieTitle: string, releaseYear: number): Promise<string | null> {
    try {
      // Формируем более точный поисковый запрос
      const searchQueries = [
        `${movieTitle} official trailer ${releaseYear}`,
        `${movieTitle} trailer ${releaseYear}`,
        `${movieTitle} teaser ${releaseYear}`,
        `${movieTitle} trailer`,
        this.cleanTitle(movieTitle) + ' trailer'
      ];

      // Пробуем каждый запрос по очереди
      for (const query of searchQueries) {
        const encodedQuery = encodeURIComponent(query);
        console.log(`\nTrying search query: "${query}"`);

        try {
          const response = await firstValueFrom(
            this.httpService.get(`${this.baseUrl}/search`, {
              params: {
                part: 'id,snippet',
                maxResults: 5,
                q: encodedQuery,
                key: this.apiKey,
                type: 'video',
                videoType: 'any',
                order: 'relevance'
              }
            })
          );

          if (response.data?.items?.length > 0) {
            console.log(`Found ${response.data.items.length} results:`);
            
            // Сначала ищем точные совпадения
            for (const video of response.data.items) {
              const matchResult = this.isLikelyTrailer(
                video.snippet.title.toLowerCase(),
                video.snippet.description.toLowerCase(),
                movieTitle.toLowerCase(),
                true // строгая проверка
              );

              if (matchResult.isMatch) {
                console.log(`✅ Found exact match: ${video.snippet.title}`);
                return `https://www.youtube.com/embed/${video.id.videoId}`;
              }
            }

            // Если точных совпадений нет, используем менее строгие критерии
            for (const video of response.data.items) {
              const matchResult = this.isLikelyTrailer(
                video.snippet.title.toLowerCase(),
                video.snippet.description.toLowerCase(),
                movieTitle.toLowerCase(),
                false // менее строгая проверка
              );

              if (matchResult.isMatch) {
                console.log(`✅ Found partial match: ${video.snippet.title}`);
                return `https://www.youtube.com/embed/${video.id.videoId}`;
              } else {
                console.log(`❌ Rejected: ${video.snippet.title}`);
                console.log(`   Reason: ${matchResult.reason}`);
              }
            }
          } else {
            console.log('No results found for this query');
          }
        } catch (searchError: unknown) {
          const error = searchError as YouTubeError;
          console.error(`API Error with query "${query}":`, error?.response?.data || error?.message || 'Unknown error');
          continue;
        }
      }

      console.log('\nNo suitable videos found after trying all queries');
      return null;
    } catch (error: unknown) {
      const ytError = error as YouTubeError;
      console.error('YouTube API Error:', {
        movieTitle,
        releaseYear,
        error: ytError?.response?.data || ytError?.message || 'Unknown error'
      });
      return null;
    }
  }

  private cleanTitle(title: string): string {
    // Удаляем специальные символы и лишние пробелы
    return title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private isLikelyTrailer(
    title: string,
    description: string,
    movieTitle: string,
    strict: boolean
  ): { isMatch: boolean; reason?: string } {
    const trailerKeywords = ['trailer', 'teaser', 'official'];
    
    // Проверяем наличие ключевых слов трейлера
    const hasTrailerKeyword = trailerKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );

    if (!hasTrailerKeyword) {
      return { isMatch: false, reason: 'No trailer keywords found' };
    }

    // Разбиваем название фильма на слова и ищем совпадения
    const movieWords = movieTitle.split(' ').filter(word => word.length > 2);
    const matchingWords = movieWords.filter(word => 
      title.includes(word) || (!strict && description.includes(word))
    );

    // В строгом режиме требуем совпадения всех слов
    // В нестрогом режиме достаточно совпадения хотя бы половины слов
    const requiredMatches = strict ? movieWords.length : Math.ceil(movieWords.length / 2);
    
    if (matchingWords.length >= requiredMatches) {
      return { isMatch: true };
    }

    return {
      isMatch: false,
      reason: `Found ${matchingWords.length}/${movieWords.length} matching words, need ${requiredMatches}`
    };
  }
} 