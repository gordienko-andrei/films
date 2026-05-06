import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { EmotionsService } from './emotions.service';
import {
  CreateEmotionDto,
  AddEmotionToFilmDto,
  EmotionResponseDto,
  FilmEmotionsResponseDto,
} from './dto/emotion.dto';
import type { Request } from 'express';

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
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Add or remove an emotion for a film (guest: body.guestKey)' })
  @ApiResponse({
    status: 200,
    description: 'Emotion has been toggled successfully',
  })
  async toggleEmotion(
    @Req() req: Request & { user?: { id: number } },
    @Param('id') filmId: string,
    @Body() dto: AddEmotionToFilmDto,
  ): Promise<void> {
    const userId = req.user?.id;
    const deviceId = dto.deviceId ?? dto.guestKey;
    if (userId != null) {
      await this.emotionsService.addEmotionToFilm(`u:${userId}`, userId, filmId, dto.emotionId);
      return;
    }
    if (!deviceId) {
      throw new BadRequestException('deviceId is required when not signed in');
    }
    await this.emotionsService.addEmotionToFilm(`g:${deviceId}`, null, filmId, dto.emotionId);
  }

  @Get(':id/user-emotions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Emotion IDs for current user or guest (?guestKey=uuid)' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of emotion IDs that user has reacted with',
    type: [Number],
  })
  async getUserEmotions(
    @Req() req: Request & { user?: { id: number } },
    @Param('id') filmId: string,
    @Query('deviceId') deviceId?: string,
    @Query('guestKey') guestKey?: string,
  ): Promise<number[]> {
    const userId = req.user?.id;
    if (userId != null) {
      return this.emotionsService.getUserEmotionsForParticipant(`u:${userId}`, filmId);
    }
    const effectiveDeviceId = deviceId ?? guestKey;
    if (!effectiveDeviceId) {
      return [];
    }
    return this.emotionsService.getUserEmotionsForParticipant(`g:${effectiveDeviceId}`, filmId);
  }
} 