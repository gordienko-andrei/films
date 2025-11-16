import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  isShowNavbar: boolean = true;

  ngOnInit(): void {
    this.router.events
    .pipe(
      filter((event: any) => event instanceof NavigationEnd),
      map(() => this.router.url)
    )
    .subscribe(url => {
      this.isShowNavbar = !url.includes('/login');
    });
  }
}
 