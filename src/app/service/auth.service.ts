import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

    private readonly API_URL = 'https://6f42-181-115-208-107.ngrok-free.app/auth';
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.API_URL}/login`, payload);
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    removeToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    setUser(user: LoginUser): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    getUser(): LoginUser | null {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? (JSON.parse(user) as LoginUser) : null;
    }

    removeUser(): void {
        localStorage.removeItem(this.USER_KEY);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        this.removeToken();
        this.removeUser();
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
}
