import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TmdbService } from './tmdb.service';
import { RecommendationsService } from './recommendations.service';
import { AnalysisService } from './analysis.service';
import { HttpModule } from '@nestjs/axios';
import { CollectionsController } from './collections.controller';
import { YoutubeService } from './youtube.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [MoviesController, CollectionsController],
  providers: [MoviesService, TmdbService, RecommendationsService, AnalysisService, YoutubeService],
  exports: [MoviesService, TmdbService, RecommendationsService, AnalysisService, YoutubeService],
})
export class MoviesModule {} 