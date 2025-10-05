import { Component, inject, Input, OnInit } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { Emoji } from '../../../interfaces/emoji.interface';
import { EmojiService } from './emoji.service';
import { forkJoin, take, tap } from 'rxjs';

@Component({
  selector: 'app-emoji-rating',
  standalone: true,
  imports: [ChipModule],
  templateUrl: './emoji-rating.component.html',
  styleUrl: './emoji-rating.component.scss'
})
export class EmojiRatingComponent implements OnInit {
  @Input() movieId!: string;

  private emojiService = inject(EmojiService);
  public emotions: Emoji[] = [];
  public selectedEmotionIds: Set<number> = new Set();
  public isLoading = false;

  ngOnInit() {
    this.loadEmojis();
  }

  loadEmojis() {
    this.isLoading = true;
    // Загружаем одновременно все эмоции и выбранные пользователем
    forkJoin({
      emotions: this.emojiService.loadAllEmojisForFilm(this.movieId),
      userEmotions: this.emojiService.getUserEmotionsForFilm(this.movieId)
    }).pipe(
      tap(({ emotions, userEmotions }) => {
        this.emotions = emotions;
        this.selectedEmotionIds = new Set(userEmotions);
      }),
      take(1)
    ).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }

  isSelected(id: number): boolean {
    return this.selectedEmotionIds.has(id);
  }

  toggleEmotion(id: number): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.emojiService.toggleEmotion(this.movieId, id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          if (this.selectedEmotionIds.has(id)) {
            this.selectedEmotionIds.delete(id);
          } else {
            this.selectedEmotionIds.add(id);
          }
          // Перезагружаем эмоции для обновления счетчиков
          this.loadEmojis();
        },
        error: () => {
          this.isLoading = false;
          // Здесь можно добавить обработку ошибки, например показать сообщение
        }
      });
  }
}
