import { Movie as PrismaMovie } from '@prisma/client';

export interface Movie extends Omit<PrismaMovie, 'id'> {
  id: string;
  posterPath: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  externalId: string | null;
}

export interface MovieWhereUniqueInput {
  id: string;
} 