import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { LoginService } from '../login.service';
import { Router, RouterModule } from '@angular/router';
import { catchError, take, tap } from 'rxjs/operators';
import { SelectButtonModule } from 'primeng/selectbutton';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PasswordModule } from 'primeng/password';
import { EMPTY } from 'rxjs';
import { MessageService } from 'primeng/api';

enum AuthorizationType {
  LOGIN = 'login',
  REGISTER = 'register'
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CardModule, InputTextModule, ReactiveFormsModule, ButtonModule, SelectButtonModule, PasswordModule, RouterModule],
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
  private messageService = inject(MessageService);
  private router = inject(Router);

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
          this.scrollLoginPageToTop();
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private scrollLoginPageToTop(): void {
    const y = 0;
    window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    });
  }

  login() {
    if (this.loginForm.invalid) {
      return;
    }
    const {email, password} = this.loginForm.getRawValue();

    this.loginService
      .login(email, password)
      .pipe(
        take(1),
        tap(() => this.router.navigate(['/'])),
        catchError(() => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Login failed' });
          return EMPTY;
        }),
      )
      .subscribe();
  }

  register() {
    if (this.registerForm.invalid) {
      return;
    }

    const {name, email, password} = this.registerForm.getRawValue();

    this.loginService
      .register(name, email, password)
      .pipe(take(1))
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: () =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Registration failed',
          }),
      });
  }
}
