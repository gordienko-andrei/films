import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecommendationsService } from './recommendations.service';

@Injectable()
export class RecommenderCronService {
  private readonly logger = new Logger(RecommenderCronService.name);

  constructor(private readonly recommendations: RecommendationsService) {}

  // Every day at 03:00
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async rebuildAllDaily() {
    this.logger.log('Starting daily recommendations rebuild...');
    try {
      await this.recommendations.rebuildAll(20);
      this.logger.log('Daily recommendations rebuild completed');
    } catch (err) {
      this.logger.error('Daily recommendations rebuild failed', err as Error);
    }
  }
}


