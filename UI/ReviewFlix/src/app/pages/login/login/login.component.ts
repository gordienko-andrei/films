import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { LoginService } from '../login.service';
import { take, tap } from 'rxjs/operators';
import { SelectButtonModule } from 'primeng/selectbutton';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PasswordModule } from 'primeng/password';

enum AuthorizationType {
  LOGIN = 'login',
  REGISTER = 'register'
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CardModule, InputTextModule, ReactiveFormsModule, ButtonModule, SelectButtonModule, PasswordModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  AuthorizationType = AuthorizationType;
  authType =  signal<AuthorizationType>(AuthorizationType.LOGIN);

  private fb = inject(NonNullableFormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private loginService = inject(LoginService);

  stateOptions: { label: string; value: AuthorizationType }[] = [
    { label: 'Login', value: AuthorizationType.LOGIN },
    { label: 'Register', value: AuthorizationType.REGISTER }
  ] ;

  AuthorizationTypeForm = this.fb.group({
    AuthorizationType: this.fb.control<AuthorizationType>(AuthorizationType.LOGIN, [Validators.required]),
  });
  
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get isLogin() {
    return this.authType() === AuthorizationType.LOGIN;
  }

  get isRegister() {
    return this.authType() === AuthorizationType.REGISTER;
  }

  ngOnInit() {
    this.AuthorizationTypeForm.controls.AuthorizationType.valueChanges
      .pipe(
        tap((value) => {
          this.authType.set(value);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  login() {
    if (this.loginForm.invalid) {
      return;
    }
    const {email, password} = this.loginForm.getRawValue();

    this.loginService.login(email, password)
      .pipe(take(1))
      .subscribe({
        next: () => {
          console.log('Login successful');
          // Токен уже сохранен в сервисе
          // Можно добавить перенаправление: this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login failed:', error);
          // TODO: Показать ошибку пользователю
        }
      });
  }

  register() {
    if (this.registerForm.invalid) {
      return;
    }

    const {name, email, password} = this.registerForm.getRawValue();

    this.loginService.register(name, email, password)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          console.log('Registration successful, user automatically logged in', response.user);
          // Токен уже сохранен в сервисе
          // Можно добавить перенаправление: this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Registration failed:', error);
          // TODO: Показать ошибку пользователю
        }
      });
  }
}
