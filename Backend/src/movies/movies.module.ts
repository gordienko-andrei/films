import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TmdbService } from './tmdb.service';
import { RecommendationsService } from './recommendations.service';
import { AnalysisService } from './analysis.service';
import { HttpModule } from '@nestjs/axios';
import { CollectionsController } from './collections.controller';
import { RecommendationsController } from './recommendations.controller';
import { YoutubeService } from './youtube.service';
import { EmotionsService } from './emotions.service';
import { EmotionsController } from './emotions.controller';
import { RecommenderCronService } from './recommender.cron.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [MoviesController, CollectionsController, EmotionsController, RecommendationsController],
  providers: [MoviesService, TmdbService, RecommendationsService, AnalysisService, YoutubeService, EmotionsService, RecommenderCronService],
  exports: [MoviesService, TmdbService, RecommendationsService, AnalysisService, YoutubeService, EmotionsService],
})
export class MoviesModule {} 