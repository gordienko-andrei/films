# Film Website API

This is the backend API for a film website built with NestJS, Prisma, and PostgreSQL.

## Features

- User authentication (JWT)
- Movie management
- Reviews and ratings
- Swagger documentation

## Prerequisites

- Node.js (v20 or later recommended)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the real values:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/film_website?schema=public"
   JWT_SECRET="your-long-random-secret"
   JWT_EXPIRES_IN="1d"
   PORT=3000
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:4200"
   COOKIE_SAME_SITE="lax"
   TMDB_API_KEY="your-tmdb-api-key"
   YOUTUBE_API_KEY="your-youtube-api-key"
   ENABLE_SWAGGER="false"
   THROTTLE_TTL_MS=60000
   THROTTLE_LIMIT=120
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

The API documentation is available at `http://localhost:3000/api` in development. In production, Swagger is disabled unless `ENABLE_SWAGGER=true`.

## Production

For production deployments, set `NODE_ENV=production`, configure a strong `JWT_SECRET`, set `FRONTEND_URL` to the deployed frontend origin, and run:

```bash
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
npm run start:prod
```

If the frontend and backend are on different domains, set `COOKIE_SAME_SITE=none` so auth cookies can be sent cross-site over HTTPS.

Security defaults in this backend:
- `helmet` is enabled globally for safer HTTP headers.
- Global request throttling is enabled through `THROTTLE_TTL_MS` + `THROTTLE_LIMIT`.
- Admin-only routes are protected with role checks (`ADMIN`).

Health check endpoint:
- `GET /health` returns status, uptime, timestamp and memory snapshot for basic monitoring and uptime probes.

## License

This project is licensed under the MIT License. 