import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Prisma, Rating } from '@prisma/client';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async checkMovieExists(movieId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }
  }

  async create(movieId: string, ratingData: { score: number }, userId: number): Promise<Rating> {
    await this.checkMovieExists(movieId);

    const existingRating = await this.prisma.rating.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    if (existingRating) {
      return this.prisma.rating.update({
        where: {
          userId_movieId: {
            userId,
            movieId,
          },
        },
        data: {
          score: ratingData.score,
        },
        include: {
          movie: true,
          user: true,
        },
      });
    }

    return this.prisma.rating.create({
      data: {
        score: ratingData.score,
        user: { connect: { id: userId } },
        movie: { connect: { id: movieId } },
      },
      include: {
        movie: true,
        user: true,
      },
    });
  }

  async findAllForMovie(movieId: string) {
    await this.checkMovieExists(movieId);

    return this.prisma.rating.findMany({
      where: { movieId },
      include: {
        user: true,
      },
    });
  }

  async getUserRating(userId: number, movieId: string) {
    return this.prisma.rating.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });
  }

  async getMovieRatingStats(movieId: string) {
    await this.checkMovieExists(movieId);

    const ratings = await this.prisma.rating.findMany({
      where: { movieId },
      select: {
        score: true,
      },
    });

    if (ratings.length === 0) {
      return {
        average: 0,
        count: 0,
      };
    }

    const result = await this.prisma.rating.aggregate({
      where: { movieId },
      _avg: {
        score: true,
      },
      _count: true,
    });

    return {
      average: result._avg?.score || 0,
      count: result._count,
    };
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
} 