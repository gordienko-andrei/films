import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(movieId: number, reviewData: { content: string; rating: number }, userId: number) {
    return this.prisma.review.create({
      data: {
        content: reviewData.content,
        rating: reviewData.rating,
        movieId,
        userId
      }
    });
  }

  async findAllByMovie(movieId: number) {
    return this.prisma.review.findMany({
      where: { movieId }
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