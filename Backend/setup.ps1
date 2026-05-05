# Install dependencies
npm install

# Copy environment template and fill in real values
if (!(Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Created .env from .env.example. Update secrets before starting the app."
}

# Generate Prisma client and run development migrations
npx prisma generate
npx prisma migrate dev

# Start the server
npm run start:dev 