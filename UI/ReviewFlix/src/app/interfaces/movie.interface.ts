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