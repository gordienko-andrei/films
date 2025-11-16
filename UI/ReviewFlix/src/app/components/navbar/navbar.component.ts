import { Component, inject } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MenubarModule, ButtonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private router = inject(Router);

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

  loginUser() {
    this.router.navigate(['/login']);
  }
}
