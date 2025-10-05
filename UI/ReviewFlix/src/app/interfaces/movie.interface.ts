export interface Movie {
  id: string;
  externalId?: string;
  title: string;
  description: string;
  year: number;
  director: string;
  genre: string;
  posterUrl?: string;
  posterPath?: string;
  trailerUrl?: string;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  genres?: string[];
  cast?: string[];
}  