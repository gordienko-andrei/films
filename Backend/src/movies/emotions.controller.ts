import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmotionsService } from './emotions.service';
import {
  CreateEmotionDto,
  AddEmotionToFilmDto,
  EmotionResponseDto,
  FilmEmotionsResponseDto,
} from './dto/emotion.dto';
import { User } from '../decorators/user.decorator';

@ApiTags('emotions')
@Controller('films')
export class EmotionsController {
  constructor(private readonly emotionsService: EmotionsService) {}

  @Get(':id/emotions')
  @ApiOperation({ summary: 'Get all emotions for a film' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of emotions with their counts',
    type: FilmEmotionsResponseDto,
  })
  async getFilmEmotions(
    @Param('id') filmId: string,
  ): Promise<FilmEmotionsResponseDto> {
    const emotions = await this.emotionsService.getFilmEmotions(filmId);
    return { emotions };
  }

  @Post(':id/emotions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add or remove an emotion for a film' })
  @ApiResponse({
    status: 200,
    description: 'Emotion has been toggled successfully',
  })
  async toggleEmotion(
    @User('id') userId: number,
    @Param('id') filmId: string,
    @Body() dto: AddEmotionToFilmDto,
  ): Promise<void> {
    await this.emotionsService.addEmotionToFilm(userId, filmId, dto.emotionId);
  }

  @Get(':id/user-emotions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user emotions for a film' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of emotion IDs that user has reacted with',
    type: [Number],
  })
  async getUserEmotions(
    @User('id') userId: number,
    @Param('id') filmId: string,
  ): Promise<number[]> {
    return this.emotionsService.getUserEmotionsForFilm(userId, filmId);
  }
} 