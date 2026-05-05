import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmotionDto, EmotionResponseDto } from './dto/emotion.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmotionsService {
  constructor(private prisma: PrismaService) {}

  async createEmotion(dto: CreateEmotionDto) {
    try {
      return await this.prisma.$queryRaw`
        INSERT INTO emotions (name, emoji, slug, "createdAt", "updatedAt")
        VALUES (${dto.name}, ${dto.emoji}, ${dto.slug}, NOW(), NOW())
        RETURNING *
      `;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Emotion with slug ${dto.slug} already exists`);
      }
      throw error;
    }
  }

  async getFilmEmotions(filmId: string): Promise<EmotionResponseDto[]> {
    const filmEmotions = await this.prisma.$queryRaw<Array<{
      id: number;
      name: string;
      emoji: string;
      slug: string;
      count: number | null;
    }>>`
      SELECT 
        e.id, 
        e.name, 
        e.emoji, 
        e.slug, 
        COALESCE(fe.count, 0) as count
      FROM emotions e
      LEFT JOIN film_emotions fe ON e.id = fe."emotionId" AND fe."filmId" = ${filmId}
    `;

    return filmEmotions.map((fe) => ({
      id: fe.id,
      name: fe.name,
      emoji: fe.emoji,
      slug: fe.slug,
      count: fe.count || 0,
    }));
  }

  async addEmotionToFilm(
    userId: number,
    filmId: string,
    emotionId: number,
  ): Promise<void> {
    const film = await this.prisma.movie.findUnique({
      where: { id: filmId },
      select: { id: true },
    });
    if (!film) {
      throw new NotFoundException(`Film with ID ${filmId} not found`);
    }

    const emotion = await this.prisma.emotion.findUnique({
      where: { id: emotionId },
      select: { id: true },
    });
    if (!emotion) {
      throw new NotFoundException(`Emotion with ID ${emotionId} not found`);
    }

    await this.prisma.$transaction(async (prisma) => {
      const existingEmotion = await prisma.$queryRaw<any[]>`
        SELECT * FROM user_emotions
        WHERE "userId" = ${userId}
        AND "filmId" = ${filmId}
        AND "emotionId" = ${emotionId}
      `;

      if (existingEmotion.length) {
        await prisma.$executeRaw`
          DELETE FROM user_emotions
          WHERE "userId" = ${userId}
          AND "filmId" = ${filmId}
          AND "emotionId" = ${emotionId}
        `;

        await prisma.$executeRaw`
          UPDATE film_emotions
          SET count = count - 1
          WHERE "filmId" = ${filmId}
          AND "emotionId" = ${emotionId}
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO user_emotions ("userId", "filmId", "emotionId", "createdAt")
          VALUES (${userId}, ${filmId}, ${emotionId}, NOW())
        `;

        await prisma.$executeRaw`
          INSERT INTO film_emotions ("filmId", "emotionId", count)
          VALUES (${filmId}, ${emotionId}, 1)
          ON CONFLICT ("filmId", "emotionId")
          DO UPDATE SET count = film_emotions.count + 1
        `;
      }
    });
  }

  async getUserEmotionsForFilm(
    userId: number,
    filmId: string,
  ): Promise<number[]> {
    const userEmotions = await this.prisma.$queryRaw<Array<{ emotionId: number }>>`
      SELECT "emotionId"
      FROM user_emotions
      WHERE "userId" = ${userId}
      AND "filmId" = ${filmId}
    `;

    return userEmotions.map((ue) => ue.emotionId);
  }
} 