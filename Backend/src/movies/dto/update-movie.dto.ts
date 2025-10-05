import { PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  @ApiProperty({
    description: 'URL of the movie trailer (YouTube embed URL)',
    required: false,
    example: 'https://www.youtube.com/embed/1234567890'
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  trailerUrl?: string;
} 