import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TagsService } from './tags.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('review-tags')
@Controller('review-tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all review tags' })
  @ApiResponse({
    status: 200,
    description: 'List of all review tags',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Atmospheric' },
          category: { type: 'string', example: 'mood' },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  async findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review tag by id' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Review tag found',
  })
  @ApiResponse({ status: 404, description: 'Review tag not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.findOne(id);
  }
}

