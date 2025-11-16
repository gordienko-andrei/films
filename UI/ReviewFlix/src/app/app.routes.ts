import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home/home.component';

export const routes: Routes = [
  { 
    path: '', component: HomeComponent 
  },
  { 
    path: 'login', loadComponent: () => import('./pages/login/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'movie/:id', 
    loadComponent: () => import('./pages/movies/movie/movie.component').then(m => m.MovieComponent)
  },
  // { 
  //   path: 'reviews', 
  //   loadComponent: () => import('./pages/reviews/reviews.component').then(m => m.ReviewsComponent)
  // }
];
