import { IsInt, IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmotionDto {
  @ApiProperty({ example: 'Funny', description: 'Name of the emotion' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '😂', description: 'Emoji representation of the emotion' })
  @IsString()
  @IsNotEmpty()
  emoji!: string;

  @ApiProperty({ example: 'funny', description: 'URL-friendly slug for the emotion' })
  @IsString()
  @IsNotEmpty()
  slug!: string;
}

export class AddEmotionToFilmDto {
  @ApiProperty({ example: 1, description: 'ID of the emotion to add' })
  @IsInt()
  @IsNotEmpty()
  emotionId!: number;

  @ApiProperty({ required: false, description: 'UUID устройства (v4), если нет JWT' })
  @IsOptional()
  @IsUUID('4')
  deviceId?: string;

  @ApiProperty({ required: false, description: 'Legacy alias for deviceId' })
  @IsOptional()
  @IsUUID('4')
  guestKey?: string;
}

export class EmotionResponseDto {
  @ApiProperty({ example: 1, description: 'Emotion ID' })
  id!: number;

  @ApiProperty({ example: 'Funny', description: 'Name of the emotion' })
  name!: string;

  @ApiProperty({ example: '😂', description: 'Emoji representation' })
  emoji!: string;

  @ApiProperty({ example: 'funny', description: 'URL-friendly slug' })
  slug!: string;

  @ApiProperty({ example: 134, description: 'Number of reactions' })
  count!: number;
}

export class FilmEmotionsResponseDto {
  @ApiProperty({ type: [EmotionResponseDto] })
  emotions!: EmotionResponseDto[];
} 