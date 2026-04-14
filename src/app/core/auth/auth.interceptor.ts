import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '@/environments/environment';
import { AuthService } from './auth.service';

let refreshInFlight: Promise<string | null> | null = null;

function ngrokHeaders(): Record<string, string> {
    return environment.apiBaseUrl.includes('ngrok')
        ? { 'ngrok-skip-browser-warning': 'true' }
        : {};
}

function requestHeaders(): Record<string, string> {
    return {
        Accept: 'application/json',
        ...ngrokHeaders()
    };
}

async function refreshAccessToken(authService: AuthService): Promise<string | null> {
    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) {
        authService.clearSession();
        return null;
    }

    try {
        const response = await fetch(`${environment.apiBaseUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...requestHeaders()
            },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            authService.clearSession();
            return null;
        }

        const payload = await response.json();
        authService.persistSession(payload, authService.isRemembered());
        return authService.getToken();
    } catch (error) {
        console.error('Error refreshing token:', error);
        authService.clearSession();
        return null;
    }
}

async function getValidToken(authService: AuthService): Promise<string | null> {
    const token = authService.getToken();
    if (!token) {
        return null;
    }

    if (!authService.isTokenExpired()) {
        return token;
    }

    if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken(authService).finally(() => {
            refreshInFlight = null;
        });
    }

    return refreshInFlight;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const excludedUrls = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/health', '/auth/init', '/auth/users-list', '/health'];
    const baseHeaders: Record<string, string> = requestHeaders();

    if (excludedUrls.some((url) => req.url.includes(url))) {
        return next(req.clone({ setHeaders: baseHeaders }));
    }

    const run = async () => {
        const hadSession = !!authService.getUser() || !!authService.getRefreshToken();
        const token = await getValidToken(authService);

        if (!token && hadSession) {
            queueMicrotask(() => void router.navigate(['/auth/login']));
        }

        const headers: Record<string, string> = { ...baseHeaders };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const user = authService.getUser();
        if (user?.rol) {
            headers['X-User-Role'] = user.rol;
        }
        if (user?.email) {
            headers['X-User-Email'] = user.email;
        }

        return req.clone({ setHeaders: headers });
    };

    return from(run()).pipe(
        switchMap((authReq) => next(authReq)),
        catchError((error: HttpErrorResponse) => {
            console.error('Request error:', error.status, error.message, error.url);
            return throwError(() => error);
        })
    );
};

