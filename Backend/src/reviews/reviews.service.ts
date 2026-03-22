import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Prisma, Review } from '@prisma/client';
import { AnalysisService } from '../movies/analysis.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private analysisService: AnalysisService,
  ) {}

  async create(movieId: string, reviewData: CreateReviewDto, userId: number): Promise<Review> {
    // Проверяем существование фильма
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    // Создаем отзыв
    const review = await this.prisma.review.create({
      data: {
        content: reviewData.content,
        rating: reviewData.rating,
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        user: { connect: { id: userId } },
        movie: { connect: { id: movieId } },
        // Связываем теги
        tags: reviewData.tagIds && reviewData.tagIds.length > 0 ? {
          connect: reviewData.tagIds.map(id => ({ id })),
        } : undefined,
        // Создаем критерии
        criteria: reviewData.criteria && reviewData.criteria.length > 0 ? {
          create: reviewData.criteria.map(criteria => ({
            name: criteria.name,
            score: criteria.score,
            comment: criteria.comment,
            templateId: criteria.templateId,
          })),
        } : undefined,
      },
      include: {
        criteria: {
          include: {
            template: true,
          },
        },
        tags: true,
      },
    });

    // Анализируем отзыв и создаем метаданные асинхронно (не блокируем создание)
    this.createReviewMetadata(review.id, review.content).catch(err => {
      console.error('Error creating review metadata:', err);
    });

    return review;
  }

  private async createReviewMetadata(reviewId: number, content: string): Promise<void> {
    try {
      // Используем AnalysisService для анализа
      const analysis = await this.analysisService.analyzeReviewContent({
        id: reviewId,
        content,
        rating: 0,
        userId: 0,
        movieId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Review);

      // Сохраняем метаданные
      await this.prisma.reviewMetadata.upsert({
        where: { reviewId },
        create: {
          reviewId,
          sentimentScore: analysis.sentiment,
          keyPhrases: analysis.keyPhrases,
        },
        update: {
          sentimentScore: analysis.sentiment,
          keyPhrases: analysis.keyPhrases,
        },
      });
    } catch (error) {
      console.error('Error in createReviewMetadata:', error);
      // Не бросаем ошибку, чтобы не нарушить создание отзыва
    }
  }

  async findAllByMovie(movieId: string) {
    return this.prisma.review.findMany({
      where: { movieId },
      include: {
        user: true,
        criteria: {
          include: {
            template: true,
          },
        },
        tags: true,
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.review.findUnique({
      where: { id }
    });
  }

  async update(id: number, reviewData: { content?: string; rating?: number }, userId: number) {
    return this.prisma.review.update({
      where: { id },
      data: reviewData
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.review.delete({
      where: { id }
    });
  }
} 