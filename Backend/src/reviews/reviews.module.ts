import { Module, forwardRef } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { CriteriaService } from './criteria.service';
import { CriteriaController } from './criteria.controller';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [forwardRef(() => MoviesModule)],
  controllers: [ReviewsController, CriteriaController, TagsController],
  providers: [ReviewsService, CriteriaService, TagsService],
  exports: [ReviewsService, CriteriaService, TagsService],
})
export class ReviewsModule {} 