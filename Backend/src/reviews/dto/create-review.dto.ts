import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'Great movie!', description: 'Review content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ example: 8, description: 'Overall rating (1-10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  rating!: number;
} 