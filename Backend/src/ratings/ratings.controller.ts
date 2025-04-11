import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post(':movieId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new rating for a movie' })
  @ApiParam({ name: 'movieId', type: 'number', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', example: 5 }
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Rating created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        score: { type: 'number', example: 5 },
        movieId: { type: 'number', example: 1 },
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
    @Body() ratingData: { score: number },
    @Request() req: any
  ) {
    return this.ratingsService.create(+movieId, ratingData, req.user.id);
  }

  @Get(':movieId')
  @ApiOperation({ summary: 'Get all ratings for a movie' })
  @ApiParam({ name: 'movieId', type: 'number', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Ratings retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          score: { type: 'number', example: 5 },
          movieId: { type: 'number', example: 1 },
          userId: { type: 'number', example: 1 },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  async findAllByMovie(@Param('movieId') movieId: string) {
    return this.ratingsService.findAllByMovie(+movieId);
  }

  @Get('rating/:id')
  @ApiOperation({ summary: 'Get a rating by id' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Rating retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        score: { type: 'number', example: 5 },
        movieId: { type: 'number', example: 1 },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  async findOne(@Param('id') id: string) {
    return this.ratingsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a rating' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', example: 5 }
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rating updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        score: { type: 'number', example: 5 },
        movieId: { type: 'number', example: 1 },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not own this rating' })
  async update(
    @Param('id') id: string,
    @Body() ratingData: { score: number },
    @Request() req: any
  ) {
    return this.ratingsService.update(+id, ratingData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a rating' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Rating deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        score: { type: 'number', example: 5 },
        movieId: { type: 'number', example: 1 },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not own this rating' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.ratingsService.remove(+id, req.user.id);
  }
} 