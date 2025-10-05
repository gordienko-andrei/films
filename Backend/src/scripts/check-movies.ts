import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMovies() {
  try {
    const movies = await prisma.movie.findMany({
      select: {
        id: true,
        title: true,
        year: true,
        director: true,
        genre: true,
        posterUrl: true,
        reviews: {
          select: {
            id: true
          }
        },
        ratings: {
          select: {
            id: true
          }
        }
      }
    });

    console.log(`Total movies in database: ${movies.length}`);
    console.log('\nSample of imported movies:');
    movies.slice(0, 5).forEach(movie => {
      console.log('\n-------------------');
      console.log(`Title: ${movie.title}`);
      console.log(`Year: ${movie.year}`);
      console.log(`Director: ${movie.director}`);
      console.log(`Genre: ${movie.genre}`);
      console.log(`Reviews: ${movie.reviews.length}`);
      console.log(`Ratings: ${movie.ratings.length}`);
    });
  } catch (error) {
    console.error('Error checking movies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMovies(); 