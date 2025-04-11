import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Movie, Review, Rating } from '@prisma/client';
import * as natural from 'natural';

interface MovieAnalysis {
  movieId: number;
  averageScore: number;
  criteriaScores: {
    [key: string]: number;
  };
  sentimentScore: number;
  popularityScore: number;
  similarityScore?: number;
}

interface ReviewCriteria {
  id: number;
  name: string;
  score: number;
  comment: string | null;
  reviewId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewWithCriteria {
  id: number;
  content: string;
  userId: number;
  movieId: number;
  createdAt: Date;
  updatedAt: Date;
  criteria: ReviewCriteria[];
}

@Injectable()
export class AnalysisService {
  private readonly tokenizer: natural.WordTokenizer;
  private readonly sentimentAnalyzer: natural.SentimentAnalyzer;

  constructor(private readonly prisma: PrismaService) {
    this.tokenizer = new natural.WordTokenizer();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  }

  async analyzeMovie(movieId: number): Promise<MovieAnalysis> {
    // Получаем отзывы с критериями через SQL
    const reviews = await this.prisma.$queryRaw<ReviewWithCriteria[]>`
      SELECT r.*, 
        json_agg(
          json_build_object(
            'id', rc.id,
            'name', rc.name,
            'score', rc.score,
            'comment', rc.comment,
            'reviewId', rc.review_id,
            'createdAt', rc.created_at,
            'updatedAt', rc.updated_at
          )
        ) as criteria
      FROM "Review" r
      LEFT JOIN "ReviewCriteria" rc ON r.id = rc.review_id
      WHERE r.movie_id = ${movieId}
      GROUP BY r.id
    `;

    const ratings = await this.prisma.rating.findMany({
      where: { movieId },
    });

    // Анализ оценок по критериям
    const criteriaScores = this.analyzeCriteria(reviews);

    // Расчет средней оценки
    const averageScore = this.calculateAverageScore(ratings, criteriaScores);

    // Анализ тональности отзывов
    const sentimentScore = await this.analyzeSentiment(reviews);

    // Расчет популярности
    const popularityScore = this.calculatePopularity(reviews.length, ratings.length);

    return {
      movieId,
      averageScore,
      criteriaScores,
      sentimentScore,
      popularityScore,
    };
  }

  private analyzeCriteria(reviews: ReviewWithCriteria[]) {
    const criteriaScores: { [key: string]: number[] } = {};

    // Группируем оценки по критериям
    reviews.forEach(review => {
      if (review.criteria) {
        review.criteria.forEach(criteria => {
          if (!criteriaScores[criteria.name]) {
            criteriaScores[criteria.name] = [];
          }
          criteriaScores[criteria.name].push(criteria.score);
        });
      }
    });

    // Рассчитываем средние оценки по каждому критерию
    const result: { [key: string]: number } = {};
    Object.entries(criteriaScores).forEach(([name, scores]) => {
      result[name] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    return result;
  }

  private calculateAverageScore(
    ratings: Rating[],
    criteriaScores: { [key: string]: number },
  ): number {
    // Учитываем как общие оценки, так и оценки по критериям
    const ratingScores = ratings.map(r => r.score);
    const criteriaAverage = Object.values(criteriaScores).reduce((a, b) => a + b, 0) / Object.keys(criteriaScores).length;

    const allScores = [...ratingScores, criteriaAverage];
    return allScores.reduce((a, b) => a + b, 0) / allScores.length;
  }

  private async analyzeSentiment(reviews: ReviewWithCriteria[]): Promise<number> {
    if (reviews.length === 0) return 0.5;

    let totalSentiment = 0;
    let validReviews = 0;

    for (const review of reviews) {
      const tokens = this.tokenizer.tokenize(review.content);
      if (!tokens || tokens.length === 0) continue;

      const sentiment = this.sentimentAnalyzer.getSentiment(tokens);
      if (sentiment !== 0) { // Игнорируем нейтральные отзывы
        totalSentiment += (sentiment + 5) / 10; // Нормализуем до 0-1
        validReviews++;
      }
    }

    return validReviews > 0 ? totalSentiment / validReviews : 0.5;
  }

  private calculatePopularity(reviewCount: number, ratingCount: number): number {
    // Учитываем количество отзывов и оценок
    const total = reviewCount + ratingCount;
    return total > 0 ? total / 100 : 0; // Нормализуем до 0-1
  }

  async findSimilarMovies(movieId: number, limit = 10): Promise<Movie[]> {
    const targetAnalysis = await this.analyzeMovie(movieId);
    
    // Получаем все фильмы с отзывами и критериями через SQL
    const allMovies = await this.prisma.$queryRaw<(Movie & { reviews: ReviewWithCriteria[] })[]>`
      SELECT m.*,
        json_agg(
          json_build_object(
            'id', r.id,
            'content', r.content,
            'userId', r.user_id,
            'movieId', r.movie_id,
            'createdAt', r.created_at,
            'updatedAt', r.updated_at,
            'criteria', (
              SELECT json_agg(
                json_build_object(
                  'id', rc.id,
                  'name', rc.name,
                  'score', rc.score,
                  'comment', rc.comment,
                  'reviewId', rc.review_id,
                  'createdAt', rc.created_at,
                  'updatedAt', rc.updated_at
                )
              )
              FROM "ReviewCriteria" rc
              WHERE rc.review_id = r.id
            )
          )
        ) as reviews
      FROM "Movie" m
      LEFT JOIN "Review" r ON m.id = r.movie_id
      GROUP BY m.id
    `;

    // Анализируем все фильмы и находим похожие
    const moviesWithScores = await Promise.all(
      allMovies
        .filter(movie => movie.id !== movieId)
        .map(async movie => {
          const analysis = await this.analyzeMovie(movie.id);
          const similarityScore = this.calculateSimilarity(targetAnalysis, analysis);
          return { movie, similarityScore };
        }),
    );

    // Сортируем по схожести и возвращаем топ-N
    return moviesWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map(item => item.movie);
  }

  private calculateSimilarity(
    target: MovieAnalysis,
    candidate: MovieAnalysis,
  ): number {
    // Учитываем все аспекты анализа для расчета схожести
    const criteriaSimilarity = this.calculateCriteriaSimilarity(
      target.criteriaScores,
      candidate.criteriaScores,
    );

    const sentimentSimilarity = 1 - Math.abs(
      target.sentimentScore - candidate.sentimentScore,
    );

    return (criteriaSimilarity + sentimentSimilarity) / 2;
  }

  private calculateCriteriaSimilarity(
    target: { [key: string]: number },
    candidate: { [key: string]: number },
  ): number {
    const allCriteria = new Set([
      ...Object.keys(target),
      ...Object.keys(candidate),
    ]);

    let totalSimilarity = 0;
    let criteriaCount = 0;

    allCriteria.forEach(criteria => {
      const targetScore = target[criteria] || 0;
      const candidateScore = candidate[criteria] || 0;
      const similarity = 1 - Math.abs(targetScore - candidateScore) / 10; // Нормализуем до 0-1
      totalSimilarity += similarity;
      criteriaCount++;
    });

    return criteriaCount > 0 ? totalSimilarity / criteriaCount : 0;
  }

  private extractKeyPhrases(text: string): string[] {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text);
    if (!tokens) return [];

    // Используем TF-IDF для определения важных слов
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(tokens.join(' '));

    const keyPhrases: string[] = [];
    tfidf.listTerms(0).forEach((item: { term: string; tfidf: number }) => {
      if (item.tfidf > 0.1) { // Порог важности
        keyPhrases.push(item.term);
      }
    });

    return keyPhrases;
  }

  async analyzeReviewContent(review: Review): Promise<{
    sentiment: number;
    keyPhrases: string[];
    topics: string[];
  }> {
    const tokens = this.tokenizer.tokenize(review.content);
    if (!tokens) {
      return {
        sentiment: 0.5,
        keyPhrases: [],
        topics: [],
      };
    }

    const sentiment = (this.sentimentAnalyzer.getSentiment(tokens) + 5) / 10;
    const keyPhrases = this.extractKeyPhrases(review.content);

    // Простой анализ тем (можно улучшить)
    const topics = this.identifyTopics(review.content);

    return {
      sentiment,
      keyPhrases,
      topics,
    };
  }

  private identifyTopics(text: string): string[] {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();

    // Простой словарь тем (можно расширить)
    const topicKeywords = {
      'сюжет': ['сюжет', 'история', 'сценарий', 'развитие'],
      'актеры': ['актеры', 'игра', 'исполнение', 'персонажи'],
      'визуал': ['визуал', 'эффекты', 'картинка', 'оператор'],
      'звук': ['звук', 'музыка', 'саундтрек', 'озвучка'],
      'режиссура': ['режиссура', 'постановка', 'режиссер', 'стиль'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }
} 