import { Component, inject, Input, OnInit } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { Emoji } from '../../../interfaces/emoji.interface';
import { EmojiService } from './emoji.service';
import { forkJoin, take, tap, catchError } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-emoji-rating',
  standalone: true,
  imports: [ChipModule, CommonModule],
  templateUrl: './emoji-rating.component.html',
  styleUrl: './emoji-rating.component.scss'
})
export class EmojiRatingComponent implements OnInit {
  @Input() movieId!: string;

  private emojiService = inject(EmojiService);
  public emotions: Emoji[] = [];
  public selectedEmotionIds: Set<number> = new Set();
  public isLoading = false;
  public error: string | null = null;

  ngOnInit() {
    this.loadEmojis();
  }

  loadEmojis() {
    this.isLoading = true;
    this.error = null;
    // Загружаем одновременно все эмоции и выбранные пользователем
    forkJoin({
      emotions: this.emojiService.loadAllEmojisForFilm(this.movieId).pipe(
        catchError(err => {
          console.error('Failed to load emotions:', err);
          this.error = 'Failed to load emotions. Please check if the API server is running.';
          return [];
        })
      ),
      userEmotions: this.emojiService.getUserEmotionsForFilm(this.movieId).pipe(
        catchError(err => {
          console.error('Failed to load user emotions:', err);
          return [];
        })
      )
    }).pipe(
      tap(({ emotions, userEmotions }) => {
        this.emotions = emotions;
        this.selectedEmotionIds = new Set(userEmotions);
      }),
      take(1)
    ).subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        console.error('Failed to load data:', err);
        this.error = 'Failed to load data. Please check if the API server is running.';
        this.isLoading = false;
      }
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
          this.loadEmojis();
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }
}
