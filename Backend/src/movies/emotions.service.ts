import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmotionDto, EmotionResponseDto } from './dto/emotion.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmotionsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const filmEmotions = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        emoji: string;
        slug: string;
        count: number | null;
      }>
    >`
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
    participantKey: string,
    userId: number | null,
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

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM user_emotions
        WHERE "participantKey" = ${participantKey}
          AND "filmId" = ${filmId}
          AND "emotionId" = ${emotionId}
      `;

      if (existing.length > 0) {
        await tx.$executeRaw`
          DELETE FROM user_emotions WHERE id = ${existing[0].id}
        `;
        const feRows = await tx.$queryRaw<Array<{ count: number }>>`
          SELECT count FROM film_emotions
          WHERE "filmId" = ${filmId} AND "emotionId" = ${emotionId}
        `;
        const cnt = feRows[0]?.count ?? 0;
        if (cnt > 0) {
          await tx.$executeRaw`
            UPDATE film_emotions
            SET count = count - 1
            WHERE "filmId" = ${filmId} AND "emotionId" = ${emotionId}
          `;
        }
        return;
      }

      await tx.$executeRaw`
        INSERT INTO user_emotions ("participantKey", "userId", "filmId", "emotionId", "createdAt")
        VALUES (${participantKey}, ${userId}, ${filmId}, ${emotionId}, NOW())
      `;

      await tx.$executeRaw`
        INSERT INTO film_emotions ("filmId", "emotionId", count)
        VALUES (${filmId}, ${emotionId}, 1)
        ON CONFLICT ("filmId", "emotionId")
        DO UPDATE SET count = film_emotions.count + 1
      `;
    });
  }

  async getUserEmotionsForParticipant(participantKey: string, filmId: string): Promise<number[]> {
    const rows = await this.prisma.$queryRaw<Array<{ emotionId: number }>>`
      SELECT "emotionId"
      FROM user_emotions
      WHERE "participantKey" = ${participantKey}
        AND "filmId" = ${filmId}
    `;
    return rows.map((r) => r.emotionId);
  }

  async mergeDeviceReactionsToUser(deviceId: string, userId: number): Promise<void> {
    const deviceKey = `g:${deviceId}`;
    const userKey = `u:${userId}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM user_emotions ue_guest
        USING user_emotions ue_user
        WHERE ue_guest."participantKey" = ${deviceKey}
          AND ue_user."participantKey" = ${userKey}
          AND ue_guest."filmId" = ue_user."filmId"
          AND ue_guest."emotionId" = ue_user."emotionId"
      `;

      await tx.$executeRaw`
        UPDATE user_emotions
        SET "participantKey" = ${userKey},
            "userId" = ${userId}
        WHERE "participantKey" = ${deviceKey}
      `;
    });
  }
}
