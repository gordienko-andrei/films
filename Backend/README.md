# Film Website API

This is the backend API for a film website built with NestJS and Prisma.

## Features

- User authentication (JWT)
- Movie management
- Reviews and ratings
- Swagger documentation

## Prerequisites

- Node.js (v16 or later)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/film_website?schema=public"
   JWT_SECRET="your-secret-key"
   JWT_EXPIRES_IN="1d"
   PORT=3000
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run start:dev
   ```

## API Documentation

The API documentation is available at `http://localhost:3000/api` when the server is running.

## License

This project is licensed under the MIT License. 