export interface CreateReview {
  content: string;
  rating: number;
  pros: string[];
  cons: string[];
  criteria: ReviewCriteria[];
  tagIds: number[];
}

interface ReviewCriteria {
  templateId: number;
  score: number;
}