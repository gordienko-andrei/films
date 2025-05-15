import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MoviesService } from '../movies/movies.service';
import { YoutubeService } from '../movies/youtube.service';
import { UpdateMovieDto } from '../movies/dto/update-movie.dto';

interface UpdateError {
  message?: string;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const moviesService = app.get(MoviesService);
  const youtubeService = app.get(YoutubeService);

  try {
    console.log('Starting trailer update process...');
    
    // Get all movies without trailers
    const moviesResponse = await moviesService.findAll();
    const movies = moviesResponse.data.filter(movie => {
      const movieAny = movie as any;
      return !movieAny.trailerUrl;
    });
    console.log(`Found ${movies.length} movies without trailers`);

    // Update each movie
    for (const movie of movies) {
      console.log(`\nProcessing movie: ${movie.title}`);
      console.log(`Movie details: ID=${movie.id}, Title="${movie.title}"`);
      
      const trailerUrl = await youtubeService.findMovieTrailer(
        movie.title,
        movie.year
      );

      if (trailerUrl) {
        try {
          // Создаем объект обновления
          const updateData: UpdateMovieDto = {
            trailerUrl
          };
          
          // Получаем актуальную информацию о фильме перед обновлением
          const currentMovie = await moviesService.findOne(movie.id);
          if (!currentMovie) {
            console.error(`Movie not found in database: ID=${movie.id}, Title="${movie.title}"`);
            continue;
          }

          await moviesService.update(currentMovie.id, updateData);
          console.log(`✅ Added trailer for: ${movie.title} (ID: ${currentMovie.id})`);
        } catch (updateError: unknown) {
          const error = updateError as UpdateError;
          console.error(`Failed to update movie ${movie.title}:`, error?.message || 'Unknown error');
          continue;
        }
      } else {
        console.log(`❌ No trailer found for: ${movie.title}`);
      }

      // Add a small delay to avoid hitting YouTube API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\nTrailer update process completed!');
  } catch (error: unknown) {
    const processError = error as UpdateError;
    console.error('Error in update process:', processError?.message || 'Unknown error');
  } finally {
    await app.close();
  }
}

bootstrap(); 