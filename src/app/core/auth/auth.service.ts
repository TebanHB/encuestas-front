import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '@/environments/environment';

export type UserRole = 'ADMINISTRADOR' | 'ENCUESTADOR' | 'ANALISTA';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginUser {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    rol: UserRole | string;
    puedeCrearEncuestas?: boolean;
    activo?: boolean;
}

export interface LoginResponse {
    token: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: LoginUser;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);

    private readonly API_URL = `${environment.apiBaseUrl}/auth`;
    private readonly TOKEN_KEY = 'auth_token';
    private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
    private readonly USER_KEY = 'auth_user';
    private readonly EXPIRES_AT_KEY = 'auth_expires_at';
    private readonly REMEMBER_ME_KEY = 'auth_remember_me';

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.API_URL}/login`, payload).pipe(
            map((response) => ({
                ...response,
                user: this.normalizeUser(response.user)
            }))
        );
    }

    refreshSession(refreshToken: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
            map((response) => ({
                ...response,
                user: this.normalizeUser(response.user)
            })),
            tap((response) => this.persistSession(response, this.isRemembered()))
        );
    }

    me(): Observable<LoginUser> {
        return this.http.get<LoginUser>(`${this.API_URL}/me`).pipe(map((user) => this.normalizeUser(user)));
    }

    logoutRemote(refreshToken: string | null): Observable<void> {
        return this.http.post<void>(`${this.API_URL}/logout`, { refreshToken });
    }

    persistSession(response: LoginResponse, rememberMe: boolean): void {
        this.clearAllSessionData();
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(this.TOKEN_KEY, response.accessToken || response.token);
        storage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        storage.setItem(this.USER_KEY, JSON.stringify(this.normalizeUser(response.user)));
        storage.setItem(this.EXPIRES_AT_KEY, String(response.expiresAt));
        storage.setItem(this.REMEMBER_ME_KEY, String(rememberMe));
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    getExpiresAt(): number | null {
        const raw = localStorage.getItem(this.EXPIRES_AT_KEY) || sessionStorage.getItem(this.EXPIRES_AT_KEY);
        return raw ? Number(raw) : null;
    }

    isTokenExpired(skewMs: number = 30_000): boolean {
        const expiresAt = this.getExpiresAt();
        return !expiresAt || Date.now() + skewMs >= expiresAt;
    }

    getUser(): LoginUser | null {
        const user = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
        return user ? (JSON.parse(user) as LoginUser) : null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken() && !!this.getUser();
    }

    logout(): void {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
            this.logoutRemote(refreshToken).subscribe({ error: () => {} });
        }
        this.clearSession();
    }

    clearSession(): void {
        this.clearAllSessionData();
    }

    updateStoredUser(user: LoginUser): void {
        const storage = this.getActiveStorage();
        if (!storage) {
            return;
        }

        storage.setItem(this.USER_KEY, JSON.stringify(this.normalizeUser(user)));
    }

    getRole(): string | null {
        return this.getUser()?.rol ?? null;
    }

    isAdministrador(): boolean {
        return this.getRole() === 'ADMINISTRADOR';
    }

    isEncuestador(): boolean {
        return this.getRole() === 'ENCUESTADOR';
    }

    isAnalista(): boolean {
        return this.getRole() === 'ANALISTA';
    }

    isRemembered(): boolean {
        return (localStorage.getItem(this.REMEMBER_ME_KEY) || sessionStorage.getItem(this.REMEMBER_ME_KEY)) === 'true';
    }

    private getActiveStorage(): Storage | null {
        if (localStorage.getItem(this.TOKEN_KEY)) {
            return localStorage;
        }

        if (sessionStorage.getItem(this.TOKEN_KEY)) {
            return sessionStorage;
        }

        return null;
    }

    private normalizeUser(user: LoginUser): LoginUser {
        return {
            ...user,
            rol: this.normalizeRole(user.rol)
        };
    }

    private normalizeRole(role: string | null | undefined): UserRole | string {
        const normalized = (role || '').trim().toUpperCase();

        switch (normalized) {
            case 'ADMIN':
            case 'ADMINISTRADOR':
                return 'ADMINISTRADOR';
            case 'EMPLEADO':
            case 'ENCUESTADOR':
                return 'ENCUESTADOR';
            case 'ANALISTA':
                return 'ANALISTA';
            default:
                return normalized || 'ENCUESTADOR';
        }
    }

    private clearAllSessionData(): void {
        [this.TOKEN_KEY, this.REFRESH_TOKEN_KEY, this.USER_KEY, this.EXPIRES_AT_KEY, this.REMEMBER_ME_KEY].forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }
}
