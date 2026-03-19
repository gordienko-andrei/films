import { Component, inject } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { Router, RouterModule } from '@angular/router';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { MoviesService } from '../../services/movies.service';
import { catchError, EMPTY, take, tap } from 'rxjs';
import { MovieSuggestionItem } from '../../interfaces/movie.interface';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MenubarModule, 
    ButtonModule, 
    RouterModule, 
    ReactiveFormsModule, 
    InputTextModule,
    AutoCompleteModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private moviesService = inject(MoviesService);
  private messageService = inject(MessageService);

  searchForm: FormGroup;
  private readonly MAX_SUGGESTIONS = 10;
  moviesSuggestions: MovieSuggestionItem[] = [];

  menuItems = [
    {
      label: 'Главная',
      icon: 'pi pi-home',
      routerLink: '/'
    },
    {
      label: 'Фильмы',
      icon: 'pi pi-video',
      routerLink: '/movies'
    },
    {
      label: 'Рецензии',
      icon: 'pi pi-star',
      routerLink: '/reviews'
    }
  ];

  constructor() {
    this.searchForm = this.fb.group({
      search: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  loginUser() {
    this.router.navigate(['/login']);
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
