import { ChangeDetectorRef, Component, ElementRef, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { Router, RouterModule } from '@angular/router';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { MoviesService } from '../../services/movies.service';
import { catchError, EMPTY, take, tap } from 'rxjs';
import { MovieSuggestionItem } from '../../interfaces/movie.interface';
import { MessageService } from 'primeng/api';
import { SessionService } from '../../services/session.service';
import { LoginService } from '../../pages/login/login.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    ButtonModule,
    DrawerModule,
    RouterModule,
    ReactiveFormsModule,
    AutoCompleteModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly session = inject(SessionService);
  private loginService = inject(LoginService);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private moviesService = inject(MoviesService);
  private messageService = inject(MessageService);
  private host = inject(ElementRef<HTMLElement>);
  private cdr = inject(ChangeDetectorRef);

  searchForm: FormGroup;
  private readonly MAX_SUGGESTIONS = 10;
  moviesSuggestions: MovieSuggestionItem[] = [];

  /** Ширина выпадающего списка = ширина поля (актуально при appendTo body) */
  autocompletePanelStyle: Record<string, string> = {};

  drawerOpen = false;

  /** Ширина выезжающей панели справа */
  readonly drawerPanelStyle: Record<string, string> = {
    width: 'min(22rem, calc(100vw - 1.25rem))',
  };

  constructor() {
    this.searchForm = this.fb.group({
      search: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  loginUser() {
    this.closeDrawer();
    this.router.navigate(['/login']);
  }

  logout() {
    this.closeDrawer();
    this.loginService
      .logout()
      .pipe(
        take(1),
        tap(() => this.router.navigate(['/'])),
        catchError(() => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Logout failed' });
          return EMPTY;
        }),
      )
      .subscribe();
  }

  onAutocompletePanelShow(): void {
    requestAnimationFrame(() => {
      const input = this.host.nativeElement.querySelector(
        '.navbar__search .p-autocomplete-input',
      ) as HTMLElement | null;
      if (input) {
        const w = Math.round(input.getBoundingClientRect().width);
        this.autocompletePanelStyle = { width: `${w}px`, 'min-width': `${w}px`, 'max-width': `${w}px` };
      } else {
        this.autocompletePanelStyle = {};
      }
      this.cdr.markForCheck();
    });
  }

  loadSuggestions(event: AutoCompleteCompleteEvent) {
    const query = event.query?.trim();
    if (!query || query.length < 2) {
      this.moviesSuggestions = [];
      return;
    }

    this.moviesService.suggestMovies(query, this.MAX_SUGGESTIONS)
      .pipe(
        take(1),
        tap((movies) => {
          this.moviesSuggestions = movies;
        })
      )
      .subscribe();
  }

  onMovieSelect(event: AutoCompleteSelectEvent) {
    const item = event.value; 
    if (item.id) {
      this.router.navigate(['/movie', item.id]);
    } else {
      this.moviesService.searchMovies(item.title, item.externalId ?? undefined)
        .pipe(
          take(1),
          catchError((error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Movie not found' });
            return EMPTY;
          }),
          tap((movie) => {
            this.router.navigate(['/movie', movie.id]);
          })
        )
        .subscribe();
    }
  }
}
