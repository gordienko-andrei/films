import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('popular')
  @ApiOperation({ summary: 'Get popular movies' })
  @ApiResponse({ status: 200, description: 'Return popular movies.' })
  getPopularMovies(@Query('limit') limit = 10) {
    return this.recommendationsService.getPopularMovies(limit);
  }

  @Get('similar/:movieId')
  @ApiOperation({ summary: 'Get similar movies' })
  @ApiResponse({ status: 200, description: 'Return similar movies.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  getSimilarMovies(@Param('movieId') movieId: string, @Query('limit') limit = 10) {
    return this.recommendationsService.getSimilarMovies(+movieId, limit);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user-based recommendations' })
  @ApiResponse({ status: 200, description: 'Return user-based recommendations.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getUserBasedRecommendations(@Param('userId') userId: string, @Query('limit') limit = 10) {
    return this.recommendationsService.getUserBasedRecommendations(+userId, limit);
  }
} 