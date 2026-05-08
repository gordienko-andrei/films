import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { Emoji } from '../../../interfaces/emoji.interface';
import { EmojiService } from './emoji.service';
import { forkJoin, take, tap, catchError, of, finalize, EMPTY, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../services/session.service';
import { GuestIdentityService } from '../../../services/guest-identity.service';
import { MessageService } from 'primeng/api';
import { ShortNumberPipe } from '../../../pipes/short-number.pipe';

@Component({
  selector: 'app-emoji-rating',
  standalone: true,
  imports: [ChipModule, CommonModule, ShortNumberPipe],
  templateUrl: './emoji-rating.component.html',
  styleUrl: './emoji-rating.component.scss',
})
export class EmojiRatingComponent implements OnChanges {
  @Input() movieId!: string;

  private emojiService = inject(EmojiService);
  private session = inject(SessionService);
  private guest = inject(GuestIdentityService);
  private messageService = inject(MessageService);

  public emotions: Emoji[] = [];
  public selectedEmotionIds: Set<number> = new Set();
  public isLoading = false;
  public error: string | null = null;
  private isLoggedIn = false;
  private readonly reactionCounterKey = 'reviewflix_anon_reactions_count';

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['movieId'] || !this.movieId) {
      return;
    }
    this.selectedEmotionIds = new Set();
    this.emotions = [];
    this.error = null;
    this.loadEmojis();
  }

  loadEmojis(): void {
    if (!this.movieId) {
      return;
    }
    this.isLoading = true;
    this.error = null;

    this.session
      .refresh()
      .pipe(
        take(1),
        switchMap(() => {
          this.isLoggedIn = this.session.user() !== null;
          const deviceId = this.isLoggedIn ? undefined : this.guest.getOrCreate();
          return forkJoin({
            emotions: this.emojiService.loadAllEmojisForFilm(this.movieId).pipe(
              catchError(() => {
                this.error =
                  'Failed to load emotions. Please check if the API server is running.';
                return of([]);
              }),
            ),
            userEmotions: this.emojiService.getUserEmotionsForFilm(this.movieId, deviceId).pipe(
              catchError(() => of([])),
            ),
          });
        }),
        tap(({ emotions, userEmotions }) => {
          this.emotions = emotions;
          this.selectedEmotionIds = new Set(userEmotions);
        }),
        catchError(() => EMPTY),
        take(1),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe();
  }

  isSelected(id: number): boolean {
    return this.selectedEmotionIds.has(id);
  }

  toggleEmotion(id: number): void {
    if (this.isLoading) return;

    this.isLoading = true;
    const deviceId = this.isLoggedIn ? undefined : this.guest.getOrCreate();
    this.emojiService
      .toggleEmotion(this.movieId, id, deviceId)
      .pipe(
        take(1),
        tap(() => {
          this.error = null;
          if (this.selectedEmotionIds.has(id)) {
            this.selectedEmotionIds.delete(id);
          } else {
            this.selectedEmotionIds.add(id);
          }
          this.maybeShowAuthPrompt();
          this.loadEmojis();
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 400) {
            this.error = err.error?.message ?? 'Invalid request.';
          } else {
            this.error = 'Failed to save reaction. Please try again.';
          }
          return EMPTY;
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe();
  }

  private maybeShowAuthPrompt(): void {
    if (this.isLoggedIn) {
      return;
    }
    const current = Number(localStorage.getItem(this.reactionCounterKey) ?? '0') + 1;
    localStorage.setItem(this.reactionCounterKey, String(current));
    if (current === 2 || current === 3) {
      this.messageService.add({
        severity: 'info',
        summary: 'Save your reactions',
        detail: 'Sign in to keep reactions and get personalized recommendations.',
      });
    }
  }
}
