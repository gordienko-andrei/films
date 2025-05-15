import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function importMovies() {
  try {
    console.log('Starting movie import...');

    // Получаем популярные фильмы
    const popularMovies = await axios.get(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );

    // Получаем новые фильмы
    const newMovies = await axios.get(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );

    // Получаем трендовые фильмы
    const trendingMovies = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`
    );

    // Объединяем все фильмы и удаляем дубликаты
    const allMovies = [
      ...popularMovies.data.results,
      ...newMovies.data.results,
      ...trendingMovies.data.results
    ].filter((movie, index, self) =>
      index === self.findIndex((m) => m.id === movie.id)
    );

    console.log(`Found ${allMovies.length} unique movies to import`);

    // Импортируем фильмы в базу данных
    for (const movie of allMovies) {
      // Получаем детали фильма для получения режиссера
      const movieDetails = await axios.get(
        `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
      );

      // Получаем жанры
      const genres = movieDetails.data.genres
        .map((genre: any) => genre.name)
        .join(', ');

      // Получаем режиссера
      const credits = await axios.get(
        `${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`
      );
      const director = credits.data.crew
        .find((person: any) => person.job === 'Director')
        ?.name || 'Unknown';

      // Проверяем, существует ли фильм
      const existingMovie = await prisma.movie.findFirst({
        where: {
          title: movie.title,
          year: new Date(movie.release_date).getFullYear()
        }
      });

      if (existingMovie) {
        // Обновляем существующий фильм
        await prisma.movie.update({
          where: { id: existingMovie.id },
          data: {
            title: movie.title,
            description: movie.overview,
            year: new Date(movie.release_date).getFullYear(),
            director: director,
            genre: genres,
            posterUrl: movie.poster_path 
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : null,
          }
        });
      } else {
        // Создаем новый фильм
        await prisma.movie.create({
          data: {
            title: movie.title,
            description: movie.overview,
            year: new Date(movie.release_date).getFullYear(),
            director: director,
            genre: genres,
            posterUrl: movie.poster_path 
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : null,
          }
        });
      }

      console.log(`Imported/Updated movie: ${movie.title}`);
    }

    console.log('Movie import completed successfully!');
  } catch (error) {
    console.error('Error importing movies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем импорт
importMovies(); 