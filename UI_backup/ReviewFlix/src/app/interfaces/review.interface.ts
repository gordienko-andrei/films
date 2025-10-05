export interface Review {
  id: string;
  movieId: string;
  userId: string;
  title: string;
  content: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  };
} 