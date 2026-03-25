import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginUser {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    rol: 'ADMIN' | 'EMPLEADO' | string;
    puedeCrearEncuestas?: boolean;
    activo?: boolean;
}

export interface LoginResponse {
    token: string;
    user: LoginUser;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);

    private readonly API_URL = `${environment.apiBaseUrl}/auth`;
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.API_URL}/login`, payload);
    }

    persistSession(token: string, user: LoginUser, rememberMe: boolean): void {
        this.clearAllSessionData();

        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem(this.TOKEN_KEY, token);
        storage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    setToken(token: string, rememberMe: boolean = true): void {
        const storage = rememberMe ? localStorage : sessionStorage;
        localStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        storage.setItem(this.TOKEN_KEY, token);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    }

    removeToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
    }

    setUser(user: LoginUser, rememberMe: boolean = true): void {
        const storage = rememberMe ? localStorage : sessionStorage;
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        storage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    getUser(): LoginUser | null {
        const user = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
        return user ? (JSON.parse(user) as LoginUser) : null;
    }

    removeUser(): void {
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.USER_KEY);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        this.clearAllSessionData();
    }

    getRole(): string | null {
        return this.getUser()?.rol ?? null;
    }

    isAdmin(): boolean {
        return this.getRole() === 'ADMIN';
    }

    isEmpleado(): boolean {
        return this.getRole() === 'EMPLEADO';
    }

    private clearAllSessionData(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
    }
}
