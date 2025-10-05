import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function getTmdbConfig() {
  const response = await axios.get(
    `${TMDB_BASE_URL}/configuration?api_key=${TMDB_API_KEY}`
  );
  return response.data;
}

async function importMovies() {
  try {
    console.log('Starting movie import...');

    // Get TMDB configuration first
    const config = await getTmdbConfig();
    const imageBaseUrl = config.images.secure_base_url;
    const posterSize = config.images.poster_sizes[3]; // Usually "w500"
    console.log(`Using image base URL: ${imageBaseUrl} with size ${posterSize}`);

    // Get popular movies
    const popularMovies = await axios.get(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );

    // Get new movies
    const newMovies = await axios.get(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );

    // Get trending movies
    const trendingMovies = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`
    );

    // Combine all movies and remove duplicates
    const allMovies = [
      ...popularMovies.data.results,
      ...newMovies.data.results,
      ...trendingMovies.data.results
    ].filter((movie, index, self) =>
      index === self.findIndex((m) => m.id === movie.id)
    );

    console.log(`Found ${allMovies.length} unique movies to import`);

    // Import movies to database
    for (const movie of allMovies) {
      try {
        // Get movie details for director
        const movieDetails = await axios.get(
          `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
        );

        // Get genres
        const genres = movieDetails.data.genres
          .map((genre: any) => genre.name)
          .join(', ');

        // Get director
        const credits = await axios.get(
          `${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`
        );
        const director = credits.data.crew
          .find((person: any) => person.job === 'Director')
          ?.name || 'Unknown';

        // Prepare poster data
        const posterPath = movie.poster_path;
        const posterUrl = posterPath ? `${imageBaseUrl}${posterSize}${posterPath}` : null;

        // Check if movie exists by external ID
        const existingMovie = await prisma.movie.findUnique({
          where: {
            externalId: movie.id.toString()
          }
        });

        if (existingMovie) {
          // Update existing movie
          await prisma.movie.update({
            where: { id: existingMovie.id },
            data: {
              title: movie.title,
              description: movie.overview,
              year: new Date(movie.release_date).getFullYear(),
              director: director,
              genre: genres,
              posterPath: posterPath,
              posterUrl: posterUrl,
              externalId: movie.id.toString(),
              updatedAt: new Date()
            }
          });
          console.log(`Updated movie: ${movie.title} with poster URL: ${posterUrl}`);
        } else {
          // Create new movie
          await prisma.movie.create({
            data: {
              title: movie.title,
              description: movie.overview,
              year: new Date(movie.release_date).getFullYear(),
              director: director,
              genre: genres,
              posterPath: posterPath,
              posterUrl: posterUrl,
              externalId: movie.id.toString()
            }
          });
          console.log(`Imported new movie: ${movie.title} with poster URL: ${posterUrl}`);
        }
      } catch (movieError) {
        console.error(`Error processing movie ${movie.title}:`, movieError);
        continue; // Continue with next movie if one fails
      }
    }

    console.log('Movie import completed successfully!');
  } catch (error) {
    console.error('Error importing movies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importMovies(); 