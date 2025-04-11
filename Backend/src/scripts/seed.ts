import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseSeeder } from './seed-database';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(DatabaseSeeder);
  
  try {
    await seeder.seed();
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await app.close();
  }
}

bootstrap(); 