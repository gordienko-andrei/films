# Install dependencies
npm install

# Create PostgreSQL database
$env:PGPASSWORD = "postgres"
psql -U postgres -c "CREATE DATABASE film_review_db;"

# Run migrations
npm run typeorm migration:run

# Start the server
npm run start:dev 