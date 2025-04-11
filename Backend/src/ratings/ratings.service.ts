import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async create(movieId: number, ratingData: { score: number }, userId: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const existingRating = await this.prisma.rating.findUnique({
      where: {
        userId_movieId: { // Правильная форма запроса с составным индексом
          userId,
          movieId,
        },
      },
    });
    

    if (existingRating) {
      throw new ConflictException('You have already rated this movie');
    }

    return this.prisma.rating.create({
      data: {
        score: ratingData.score,
        movie: { connect: { id: movieId } },
        user: { connect: { id: userId } },
      },
    });
  }

  async findAllByMovie(movieId: number) {
    return this.prisma.rating.findMany({
      where: { movieId }
    });
  }

  async findOne(id: number) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }

  async update(id: number, ratingData: { score: number }, userId: number) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.userId !== userId) {
      throw new ConflictException('You can only update your own ratings');
    }

    return this.prisma.rating.update({
      where: { id },
      data: ratingData,
    });
  }

  async remove(id: number, userId: number) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.userId !== userId) {
      throw new ConflictException('You can only delete your own ratings');
    }

    return this.prisma.rating.delete({
      where: { id },
    });
  }

  async getAverageRating(movieId: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const result = await this.prisma.rating.aggregate({
      where: { movieId },
      _avg: { score: true },
      _count: true,
    });

    return {
      average: result._avg.score || 0,
      count: result._count,
    };
  }
} 