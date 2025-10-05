import { Component, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenubarModule, ButtonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isBrowser: boolean;
  isServer: boolean;

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      console.log('Running in browser');
    }

    if (this.isServer) {
      console.log('Running on server');
    }
  }
}
 