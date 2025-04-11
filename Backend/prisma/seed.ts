// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   // Создаем пользователей
//   const users = await Promise.all([
//     prisma.user.create({
//       data: {
//         email: 'admin@example.com',
//         password: await bcrypt.hash('admin123', 10),
//         name: 'Admin User',
//         role: 'ADMIN',
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'user@example.com',
//         password: await bcrypt.hash('user123', 10),
//         name: 'Regular User',
//         role: 'USER',
//       },
//     }),
//   ]);

//   // Создаем фильмы
//   const movies = await Promise.all([
//     prisma.movie.create({
//       data: {
//         title: 'Inception',
//         description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
//         year: 2010,
//         director: 'Christopher Nolan',
//         genre: 'Sci-Fi',
//         posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
//       },
//     }),
//     prisma.movie.create({
//       data: {
//         title: 'The Shawshank Redemption',
//         description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
//         year: 1994,
//         director: 'Frank Darabont',
//         genre: 'Drama',
//         posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg',
//       },
//     }),
//     prisma.movie.create({
//       data: {
//         title: 'The Dark Knight',
//         description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
//         year: 2008,
//         director: 'Christopher Nolan',
//         genre: 'Action',
//         posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg',
//       },
//     }),
//   ]);

//   // Создаем отзывы и критерии
//   for (const movie of movies) {
//     for (const user of users) {
//       const review = await prisma.review.create({
//         data: {
//           content: `Great movie! ${movie.title} is one of my favorites.`,
//           rating: Math.floor(Math.random() * 10) + 1,
//           userId: user.id,
//           movieId: movie.id,
//         },
//       });

//       // Создаем критерии отдельно
//       await prisma.reviewCriteria.createMany({
//         data: [
//           {
//             name: 'сюжет',
//             score: Math.floor(Math.random() * 10) + 1,
//             comment: 'Интересный и захватывающий сюжет',
//             reviewId: review.id,
//           },
//           {
//             name: 'актеры',
//             score: Math.floor(Math.random() * 10) + 1,
//             comment: 'Отличная актерская игра',
//             reviewId: review.id,
//           },
//           {
//             name: 'визуал',
//             score: Math.floor(Math.random() * 10) + 1,
//             comment: 'Потрясающие визуальные эффекты',
//             reviewId: review.id,
//           },
//           {
//             name: 'звук',
//             score: Math.floor(Math.random() * 10) + 1,
//             comment: 'Отличный саундтрек',
//             reviewId: review.id,
//           },
//           {
//             name: 'режиссура',
//             score: Math.floor(Math.random() * 10) + 1,
//             comment: 'Мастерская режиссура',
//             reviewId: review.id,
//           },
//         ],
//       });

//       // Создаем рейтинги
//       await prisma.rating.create({
//         data: {
//           score: Math.floor(Math.random() * 10) + 1,
//           userId: user.id,
//           movieId: movie.id,
//         },
//       });
//     }
//   }

//   // Создаем теги
//   const tags = await Promise.all([
//     prisma.tag.create({ data: { name: 'action' } }),
//     prisma.tag.create({ data: { name: 'drama' } }),
//     prisma.tag.create({ data: { name: 'sci-fi' } }),
//     prisma.tag.create({ data: { name: 'thriller' } }),
//     prisma.tag.create({ data: { name: 'crime' } }),
//   ]);

//   // Связываем фильмы с тегами
//   for (const movie of movies) {
//     const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 3);
//     for (const tag of randomTags) {
//       await prisma.movieTag.create({
//         data: {
//           movieId: movie.id,
//           tagId: tag.id,
//         },
//       });
//     }
//   }

//   // Создаем коллекции
//   const collections = await Promise.all([
//     prisma.collection.create({
//       data: {
//         name: 'Popular Movies',
//         description: 'Most popular movies of all time',
//         type: 'POPULAR',
//       },
//     }),
//     prisma.collection.create({
//       data: {
//         name: 'Trending Now',
//         description: 'Currently trending movies',
//         type: 'TRENDING',
//       },
//     }),
//   ]);

//   // Добавляем фильмы в коллекции
//   for (const collection of collections) {
//     for (const movie of movies) {
//       await prisma.movieCollection.create({
//         data: {
//           movieId: movie.id,
//           collectionId: collection.id,
//         },
//       });
//     }
//   }

//   console.log('Seed data has been created successfully!');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   }); 