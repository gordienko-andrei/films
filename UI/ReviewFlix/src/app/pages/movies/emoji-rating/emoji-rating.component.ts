import { Component, inject, Input, OnInit } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { Emoji } from '../../../interfaces/emoji.interface';
import { EmojiService } from './emoji.service';
import { forkJoin, take, tap, catchError, of, finalize, EMPTY } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
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
    if (!this.movieId) return;
    this.loadEmojis();
  }

  loadEmojis() {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      emotions: this.emojiService.loadAllEmojisForFilm(this.movieId).pipe(
        catchError(() => {
          this.error = 'Failed to load emotions. Please check if the API server is running.';
          return of([]);
        })
      ),
      userEmotions: this.emojiService.getUserEmotionsForFilm(this.movieId).pipe(
        catchError(() => {
          return of([]);
        })
      )
    })
    .pipe(
      tap(({ emotions, userEmotions }) => {
        this.emotions = emotions;
        this.selectedEmotionIds = new Set(userEmotions);
      }),
      catchError(() => {
        return EMPTY;
      }),
      take(1),
      finalize(() => this.isLoading = false)
    )
    .subscribe();
  }

  isSelected(id: number): boolean {
    return this.selectedEmotionIds.has(id);
  }

  toggleEmotion(id: number): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.emojiService.toggleEmotion(this.movieId, id)
      .pipe(take(1),
        tap(() => {
          this.error = null;
          if (this.selectedEmotionIds.has(id)) {
            this.selectedEmotionIds.delete(id);
          } else {
            this.selectedEmotionIds.add(id);
          }
          this.loadEmojis();
        }),
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401 || err.status === 403) {
              this.error = 'Please sign in to react to this movie.';
            } else {
              this.error = 'Failed to save reaction. Please try again.';
            }
          return EMPTY;
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }
}
