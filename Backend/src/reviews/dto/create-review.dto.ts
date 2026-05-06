import { IsString, IsInt, Min, Max, IsNotEmpty, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewCriteriaDto {
  @ApiProperty({ type: Number, example: 1, description: 'ID шаблона критерия', required: false })
  @IsInt()
  @IsOptional()
  templateId?: number;

  @ApiProperty({ type: String, example: 'Сюжет', description: 'Название критерия (если нет templateId)', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ type: Number, example: 8, description: 'Оценка по критерию (1-10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  score!: number;

  @ApiProperty({ type: String, example: 'Отличный сюжет с неожиданными поворотами', required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreateReviewDto {
  @ApiProperty({ type: String, example: 'Great movie!', description: 'Review content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ type: Number, example: 8, description: 'Overall rating (1-10)' })
  @IsInt()
  @Min(1)
  @Max(10)
  rating!: number;

  @ApiProperty({ 
    type: [String],
    example: ['Отличная актерская игра', 'Захватывающий сюжет'], 
    description: 'Что понравилось',
    required: false 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pros?: string[];

  @ApiProperty({ 
    type: [String],
    example: ['Слишком длинный', 'Плохая концовка'], 
    description: 'Что не понравилось',
    required: false 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cons?: string[];

  @ApiProperty({ 
    type: [Number],
    example: [1, 2, 3], 
    description: 'ID тегов отзыва',
    required: false 
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  tagIds?: number[];

  @ApiProperty({ 
    type: [ReviewCriteriaDto],
    example: [{ templateId: 1, score: 9, comment: 'Отлично' }], 
    description: 'Детальные критерии оценки',
    required: false 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewCriteriaDto)
  @IsOptional()
  criteria?: ReviewCriteriaDto[];

} 