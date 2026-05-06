export interface ReviewUser {
  id: number;
  name: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCriterionTemplate {
  id: number;
  name: string;
  category: string;
  weight: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCriteria {
  id: number;
  name: string | null;
  score: number;
  comment: string | null;
  reviewId: number;
  templateId: number | null;
  createdAt: string;
  updatedAt: string;
  template: ReviewCriterionTemplate | null;
}

export interface ReviewTag {
  id: number;
  name: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewMetadata {
  id: number;
  reviewId: number;
  sentimentScore: number | null;
  keyPhrases: string[];
  embedding: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  content: string;
  rating: number;
  pros: string[];
  cons: string[];
  createdAt: string;
  updatedAt: string;
  userId: number | null;
  movieId: string;
  user: ReviewUser | null;
  criteria: ReviewCriteria[];
  tags: ReviewTag[];
  metadata: ReviewMetadata | null;
}