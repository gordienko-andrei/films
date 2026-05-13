import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async findAllCriterionTemplates() {
    await this.ensureDefaultCriterionTemplates();
    return this.prisma.reviewCriterionTemplate.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findAllReviewTags() {
    await this.ensureDefaultReviewTags();
    return this.prisma.reviewTag.findMany({
      orderBy: { id: 'asc' },
    });
  }

  private async ensureDefaultCriterionTemplates(): Promise<void> {
    const count = await this.prisma.reviewCriterionTemplate.count();
    if (count > 0) return;

    const rows: { name: string; category: string; weight: number; isRequired: boolean }[] = [
      { name: 'Story', category: 'story', weight: 1.2, isRequired: false },
      { name: 'Acting', category: 'acting', weight: 1.2, isRequired: false },
      { name: 'Direction', category: 'directing', weight: 1.0, isRequired: false },
      { name: 'Cinematography', category: 'technical', weight: 1.0, isRequired: false },
      { name: 'Music & sound', category: 'audio', weight: 0.9, isRequired: false },
      { name: 'Pacing', category: 'pacing', weight: 0.9, isRequired: false },
    ];

    for (const r of rows) {
      await this.prisma.reviewCriterionTemplate.upsert({
        where: { name: r.name },
        create: r,
        update: { category: r.category, weight: r.weight, isRequired: r.isRequired },
      });
    }
  }

  private async ensureDefaultReviewTags(): Promise<void> {
    const count = await this.prisma.reviewTag.count();
    if (count > 0) return;

    const rows: { name: string; category: string }[] = [
      { name: 'Masterpiece', category: 'mood' },
      { name: 'Rewatchable', category: 'mood' },
      { name: 'Slow / dull', category: 'mood' },
      { name: 'Twist ending', category: 'genre-feel' },
      { name: 'Family-friendly', category: 'audience' },
      { name: 'Mature themes', category: 'audience' },
      { name: 'Funny', category: 'mood' },
      { name: 'Dramatic', category: 'genre-feel' },
    ];

    for (const r of rows) {
      await this.prisma.reviewTag.upsert({
        where: { name: r.name },
        create: r,
        update: { category: r.category },
      });
    }
  }

  async create(
    movieId: string,
    reviewData: CreateReviewDto,
    userId: number,
  ): Promise<Review> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const authorRef = `u:${userId}`;

    try {
      const review = await this.prisma.review.create({
        data: {
          authorRef,
          content: reviewData.content,
          rating: reviewData.rating,
          pros: reviewData.pros || [],
          cons: reviewData.cons || [],
          user: { connect: { id: userId } },
          movie: { connect: { id: movieId } },
          tags:
            reviewData.tagIds && reviewData.tagIds.length > 0
              ? {
                  connect: reviewData.tagIds.map((id) => ({ id })),
                }
              : undefined,
          criteria:
            reviewData.criteria && reviewData.criteria.length > 0
              ? {
                  create: reviewData.criteria.map((criteria) => ({
                    name: criteria.name,
                    score: criteria.score,
                    comment: criteria.comment,
                    templateId: criteria.templateId,
                  })),
                }
              : undefined,
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

      this.createReviewMetadata(review.id, review.content).catch((err) => {
        console.error('Error creating review metadata:', err);
      });

      return review;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('You already submitted a review for this movie');
      }
      throw e;
    }
  }

  private async createReviewMetadata(reviewId: number, content: string): Promise<void> {
    try {
      const analysis = await this.analysisService.analyzeReviewContent({
        id: reviewId,
        content,
        rating: 0,
        userId: 0,
        movieId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Review);

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