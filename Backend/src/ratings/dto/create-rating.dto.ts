import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ example: 8, description: 'Rating score (1-10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  score!: number;
} 