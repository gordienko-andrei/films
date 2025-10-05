import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Prisma, Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(movieId: string, reviewData: { content: string; rating: number }, userId: number): Promise<Review> {
    return this.prisma.review.create({
      data: {
        content: reviewData.content,
        rating: reviewData.rating,
        user: { connect: { id: userId } },
        movie: { connect: { id: movieId } },
      },
    });
  }

  async findAllByMovie(movieId: string) {
    return this.prisma.review.findMany({
      where: { movieId },
      include: {
        user: true,
        criteria: true,
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