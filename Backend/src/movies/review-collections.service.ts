import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Movie } from '@prisma/client';

@Injectable()
export class ReviewCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Подборка фильмов с высокими оценками по определенному критерию
   */
  async getMoviesByCriteria(
    criterionName: string, 
    minScore: number = 7, 
    limit: number = 20
  ): Promise<Movie[]> {
    const reviews = await this.prisma.review.findMany({
      where: {
        criteria: {
          some: {
            OR: [
              { name: criterionName },
              { template: { name: criterionName } },
            ],
            score: { gte: minScore },
          },
        },
      },
      include: {
        movie: true,
        criteria: {
          include: {
            template: true,
          },
        },
      },
    });

    // Группируем по фильмам и считаем среднюю оценку по критерию
    const movieScores = new Map<string, { total: number; count: number; movie: Movie }>();
    
    reviews.forEach(review => {
      const criterion = review.criteria.find(
        c => (c.name === criterionName || c.template?.name === criterionName) && c.score >= minScore
      );
      
      if (criterion) {
        const existing = movieScores.get(review.movieId);
        if (existing) {
          existing.total += criterion.score;
          existing.count += 1;
        } else {
          movieScores.set(review.movieId, {
            total: criterion.score,
            count: 1,
            movie: review.movie,
          });
        }
      }
    });

    // Сортируем по средней оценке
    return Array.from(movieScores.values())
      .map(item => ({
        ...item.movie,
        avgCriterionScore: item.total / item.count,
      }))
      .sort((a, b) => (b.avgCriterionScore || 0) - (a.avgCriterionScore || 0))
      .slice(0, limit)
      .map(item => {
        const { avgCriterionScore, ...movie } = item;
        return movie;
      });
  }

  /**
   * Подборка фильмов по тегам отзывов
   */
  async getMoviesByReviewTags(tagIds: number[], limit: number = 20): Promise<Movie[]> {
    const reviews = await this.prisma.review.findMany({
      where: {
        tags: {
          some: {
            id: { in: tagIds },
          },
        },
        rating: { gte: 7 }, // Только хорошие отзывы
      },
      include: {
        movie: true,
        tags: true,
      },
    });

    // Подсчитываем количество совпадений тегов для каждого фильма
    const movieTagCounts = new Map<string, { count: number; movie: Movie }>();
    
    reviews.forEach(review => {
      const matchingTags = review.tags.filter(t => tagIds.includes(t.id)).length;
      if (matchingTags > 0) {
        const existing = movieTagCounts.get(review.movieId);
        if (existing) {
          existing.count += matchingTags;
        } else {
          movieTagCounts.set(review.movieId, {
            count: matchingTags,
            movie: review.movie,
          });
        }
      }
    });

    return Array.from(movieTagCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.movie);
  }

  /**
   * Подборка фильмов с похожими достоинствами (pros)
   */
  async getMoviesByPros(pros: string[], limit: number = 20): Promise<Movie[]> {
    // Ищем фильмы, у которых в отзывах есть похожие pros
    const reviews = await this.prisma.review.findMany({
      where: {
        pros: {
          hasSome: pros, // PostgreSQL array operator
        },
        rating: { gte: 7 },
      },
      include: {
        movie: true,
      },
    });

    // Подсчитываем совпадения
    const movieMatches = new Map<string, { count: number; movie: Movie }>();
    
    reviews.forEach(review => {
      const matchingPros = review.pros.filter(p => 
        pros.some(searchPro => 
          p.toLowerCase().includes(searchPro.toLowerCase()) ||
          searchPro.toLowerCase().includes(p.toLowerCase())
        )
      ).length;

      if (matchingPros > 0) {
        const existing = movieMatches.get(review.movieId);
        if (existing) {
          existing.count += matchingPros;
        } else {
          movieMatches.set(review.movieId, {
            count: matchingPros,
            movie: review.movie,
          });
        }
      }
    });

    return Array.from(movieMatches.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.movie);
  }

  /**
   * Подборка фильмов с похожими недостатками (cons)
   * Полезно для поиска фильмов с похожими проблемами
   */
  async getMoviesByCons(cons: string[], limit: number = 20): Promise<Movie[]> {
    const reviews = await this.prisma.review.findMany({
      where: {
        cons: {
          hasSome: cons,
        },
      },
      include: {
        movie: true,
      },
    });

    const movieMatches = new Map<string, { count: number; movie: Movie }>();
    
    reviews.forEach(review => {
      const matchingCons = review.cons.filter(c => 
        cons.some(searchCon => 
          c.toLowerCase().includes(searchCon.toLowerCase()) ||
          searchCon.toLowerCase().includes(c.toLowerCase())
        )
      ).length;

      if (matchingCons > 0) {
        const existing = movieMatches.get(review.movieId);
        if (existing) {
          existing.count += matchingCons;
        } else {
          movieMatches.set(review.movieId, {
            count: matchingCons,
            movie: review.movie,
          });
        }
      }
    });

    return Array.from(movieMatches.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.movie);
  }

  /**
   * Подборка на основе похожих отзывов пользователей (collaborative filtering)
   */
  async getMoviesBySimilarReviews(
    userId: number, 
    limit: number = 20
  ): Promise<Movie[]> {
    // Получаем отзывы текущего пользователя
    const userReviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        criteria: { 
          include: { template: true } 
        },
        tags: true,
        metadata: true,
      },
    });

    if (userReviews.length === 0) {
      return [];
    }

    // Строим профиль пользователя
    const userProfile = this.buildUserProfile(userReviews);

    // Находим похожих пользователей
    const similarUsers = await this.findSimilarUsers(userProfile, userId);

    // Получаем фильмы, которые понравились похожим пользователям
    const recommendedMovies = await this.getMoviesFromSimilarUsers(
      similarUsers,
      userId,
      limit
    );

    return recommendedMovies;
  }

  private buildUserProfile(reviews: any[]) {
    const criteriaPreferences: { [key: string]: number } = {};
    const tagPreferences: Set<number> = new Set();
    const prosSet: Set<string> = new Set();
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    reviews.forEach(review => {
      // Анализируем критерии
      review.criteria.forEach((c: any) => {
        const key = c.template?.name || c.name || 'unknown';
        if (key) {
          criteriaPreferences[key] = (criteriaPreferences[key] || 0) + c.score;
        }
      });

      // Собираем теги
      review.tags.forEach((t: any) => tagPreferences.add(t.id));
      
      // Собираем pros
      review.pros.forEach((p: string) => prosSet.add(p.toLowerCase()));
    });

    // Нормализуем критерии
    Object.keys(criteriaPreferences).forEach(key => {
      criteriaPreferences[key] /= reviews.length;
    });

    return {
      criteriaPreferences,
      tagPreferences: Array.from(tagPreferences),
      pros: Array.from(prosSet),
      averageRating,
    };
  }

  private async findSimilarUsers(
    userProfile: any, 
    excludeUserId: number
  ): Promise<number[]> {
    // Получаем всех пользователей с отзывами
    const allUsers = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        reviews: {
          some: {},
        },
      },
      include: {
        reviews: {
          include: {
            criteria: { include: { template: true } },
            tags: true,
          },
        },
      },
    });

    // Вычисляем похожесть
    const userSimilarities: { userId: number; similarity: number }[] = [];

    for (const user of allUsers) {
      const userProfile2 = this.buildUserProfile(user.reviews);
      const similarity = this.calculateProfileSimilarity(userProfile, userProfile2);
      
      if (similarity > 0.5) { // Порог похожести
        userSimilarities.push({ userId: user.id, similarity });
      }
    }

    // Сортируем и возвращаем топ похожих
    return userSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map(u => u.userId);
  }

  private calculateProfileSimilarity(profile1: any, profile2: any): number {
    // Сравнение критериев
    let criteriaSimilarity = 0;
    let criteriaCount = 0;
    
    const allCriteria = new Set([
      ...Object.keys(profile1.criteriaPreferences),
      ...Object.keys(profile2.criteriaPreferences),
    ]);

    allCriteria.forEach(key => {
      const score1 = profile1.criteriaPreferences[key] || 0;
      const score2 = profile2.criteriaPreferences[key] || 0;
      criteriaSimilarity += 1 - Math.abs(score1 - score2) / 10;
      criteriaCount++;
    });

    const avgCriteriaSim = criteriaCount > 0 ? criteriaSimilarity / criteriaCount : 0;

    // Сравнение тегов
    const tagIntersection = profile1.tagPreferences.filter((t: number) =>
      profile2.tagPreferences.includes(t)
    ).length;
    const tagUnion = new Set([
      ...profile1.tagPreferences,
      ...profile2.tagPreferences,
    ]).size;
    const tagSimilarity = tagUnion > 0 ? tagIntersection / tagUnion : 0;

    // Сравнение pros
    const prosIntersection = profile1.pros.filter((p: string) =>
      profile2.pros.includes(p)
    ).length;
    const prosUnion = new Set([...profile1.pros, ...profile2.pros]).size;
    const prosSimilarity = prosUnion > 0 ? prosIntersection / prosUnion : 0;

    // Взвешенное среднее
    return (avgCriteriaSim * 0.4 + tagSimilarity * 0.3 + prosSimilarity * 0.3);
  }

  private async getMoviesFromSimilarUsers(
    similarUserIds: number[],
    excludeUserId: number,
    limit: number
  ): Promise<Movie[]> {
    if (similarUserIds.length === 0) {
      return [];
    }

    const reviews = await this.prisma.review.findMany({
      where: {
        userId: { in: similarUserIds },
        rating: { gte: 7 }, // Только хорошие оценки
        movie: {
          reviews: {
            none: {
              userId: excludeUserId, // Исключаем фильмы, которые пользователь уже оценил
            },
          },
        },
      },
      include: {
        movie: true,
      },
    });

    // Подсчитываем рекомендации
    const movieRecommendations = new Map<string, { count: number; movie: Movie }>();

    reviews.forEach(review => {
      const existing = movieRecommendations.get(review.movieId);
      if (existing) {
        existing.count += 1;
      } else {
        movieRecommendations.set(review.movieId, {
          count: 1,
          movie: review.movie,
        });
      }
    });

    return Array.from(movieRecommendations.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.movie);
  }
}











