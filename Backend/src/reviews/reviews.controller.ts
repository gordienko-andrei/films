import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('criterion-templates')
  @ApiOperation({ summary: 'List review criterion templates (for create-review form)' })
  @ApiResponse({ status: 200, description: 'Templates returned' })
  getCriterionTemplates() {
    return this.reviewsService.findAllCriterionTemplates();
  }

  @Get('tags')
  @ApiOperation({ summary: 'List review tags (for create-review form)' })
  @ApiResponse({ status: 200, description: 'Tags returned' })
  getReviewTags() {
    return this.reviewsService.findAllReviewTags();
  }

  @Post(':movieId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review for a movie' })
  @ApiParam({ name: 'movieId', type: 'string', example: 'uuid-v4' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Review created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        content: { type: 'string', example: 'This movie was absolutely amazing! The acting was superb and the story was captivating.' },
        rating: { type: 'number', example: 5 },
        pros: { type: 'array', items: { type: 'string' }, example: ['Отличная актерская игра'] },
        cons: { type: 'array', items: { type: 'string' }, example: ['Слишком длинный'] },
        movieId: { type: 'string', example: 'uuid-v4' },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async create(
    @Param('movieId') movieId: string,
    @Body() reviewData: CreateReviewDto,
    @Request() req: any,
  ) {
    return this.reviewsService.create(movieId, reviewData, req.user.id);
  }

  @Get(':movieId')
  @ApiOperation({ summary: 'Get all reviews for a movie' })
  @ApiParam({ name: 'movieId', type: 'string', example: 'uuid-v4' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reviews retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          content: { type: 'string', example: 'This movie was absolutely amazing! The acting was superb and the story was captivating.' },
          rating: { type: 'number', example: 5 },
          movieId: { type: 'string', example: 'uuid-v4' },
          userId: { type: 'number', example: 1 },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  async findAllByMovie(@Param('movieId') movieId: string) {
    return this.reviewsService.findAllByMovie(movieId);
  }

  @Get('review/:id')
  @ApiOperation({ summary: 'Get a review by id' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Review retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        content: { type: 'string', example: 'This movie was absolutely amazing! The acting was superb and the story was captivating.' },
        rating: { type: 'number', example: 5 },
        movieId: { type: 'string', example: 'uuid-v4' },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'This movie was absolutely amazing! The acting was superb and the story was captivating.' },
        rating: { type: 'number', example: 5 }
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Review updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        content: { type: 'string', example: 'This movie was absolutely amazing! The acting was superb and the story was captivating.' },
        rating: { type: 'number', example: 5 },
        movieId: { type: 'string', example: 'uuid-v4' },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not own this review' })
  async update(
    @Param('id') id: string,
    @Body() reviewData: { content?: string; rating?: number },
    @Request() req: any
  ) {
    return this.reviewsService.update(+id, reviewData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Review deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        content: { type: 'string', example: 'This movie was absolutely amazing! The acting was superb and the story was captivating.' },
        rating: { type: 'number', example: 5 },
        movieId: { type: 'string', example: 'uuid-v4' },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not own this review' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.reviewsService.remove(+id, req.user.id);
  }
} 