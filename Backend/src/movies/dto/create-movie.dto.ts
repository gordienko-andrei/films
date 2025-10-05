import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUrl, Min, Max, Length } from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({
    example: 'The Shawshank Redemption',
    description: 'The title of the movie',
  })
  @IsString()
  @Length(1, 255)
  title!: string;

  @ApiProperty({
    example: 'Two imprisoned men bond over a number of years...',
    description: 'The description of the movie',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    example: 1994,
    description: 'The release year of the movie',
  })
  @IsNumber()
  @Min(1888)
  @Max(new Date().getFullYear())
  year!: number;

  @ApiProperty({
    example: 'Frank Darabont',
    description: 'The director of the movie',
  })
  @IsString()
  @Length(1, 255)
  director!: string;

  @ApiProperty({
    example: 'Drama',
    description: 'The genre of the movie',
  })
  @IsString()
  @Length(1, 100)
  genre!: string;

  @ApiProperty({
    example: '/path/to/poster.jpg',
    description: 'The TMDB poster path',
    required: false,
  })
  @IsOptional()
  @IsString()
  posterPath?: string;

  @ApiProperty({
    example: 'https://example.com/poster.jpg',
    description: 'The URL of the movie poster (deprecated)',
    required: false,
    deprecated: true
  })
  @IsOptional()
  @IsUrl()
  posterUrl?: string;

  @ApiProperty({
    example: '12345',
    description: 'The external ID (e.g. TMDB ID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalId?: string;
}
