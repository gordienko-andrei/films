import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CriteriaService } from './criteria.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('review-criteria')
@Controller('review-criteria')
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all review criterion templates' })
  @ApiResponse({
    status: 200,
    description: 'List of all criterion templates',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Plot' },
          category: { type: 'string', example: 'story' },
          weight: { type: 'number', example: 1.0 },
          isRequired: { type: 'boolean', example: false },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  async findAll() {
    return this.criteriaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a criterion template by id' })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Criterion template found',
  })
  @ApiResponse({ status: 404, description: 'Criterion template not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.criteriaService.findOne(id);
  }
}

