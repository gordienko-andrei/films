/** Снимок credits с бэка (TMDB) */
export interface MovieCreditsCastMember {
  id?: number;
  name: string;
  character?: string;
  profileUrl?: string | null;
}

export interface MovieCreditsCrewMember {
  name: string;
  job: string;
}

export interface MovieCreditsSnapshot {
  cast: MovieCreditsCastMember[];
  crew: MovieCreditsCrewMember[];
  createdBy?: { id?: number; name: string; profileUrl?: string | null }[];
}

export interface Movie {
  id: string;
  externalId?: string;
  mediaType?: string;
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
  credits?: MovieCreditsSnapshot | null;
}

/** Подборка по настроению (эмоции) с бэка GET /collections/mood-picks */
export interface MoodPick {
  slug: string;
  name: string;
  emoji: string;
  movies: Movie[];
}

/** Подборка по жанру с бэка GET /collections/genre-spotlights */
export interface GenrePick {
  genre: string;
  movies: Movie[];
}

export interface MovieSuggestionItem {
  id?: string;
  externalId: string | null;
  mediaType?: 'movie' | 'tv';
  title: string;
  year: number;
  posterPath: string | null;
  posterUrl: string | null;
  inDatabase: boolean;
}