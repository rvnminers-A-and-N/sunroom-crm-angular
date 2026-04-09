import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@core/models/user.model';

const TOKEN_KEY = 'sunroom_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$$ = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUser$$.asObservable();

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUser(): User | null {
    return this.currentUser$$.value;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', request).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        this.currentUser$$.next(res.user);
      }),
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', request).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        this.currentUser$$.next(res.user);
      }),
    );
  }

  loadCurrentUser(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(tap((user) => this.currentUser$$.next(user)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser$$.next(null);
    this.router.navigate(['/auth/login']);
  }
}
