import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, switchMap, catchError, of } from 'rxjs';
import { environment } from '@/environments/environment';
import { AuthService } from './auth.service';

let refreshInFlight: Promise<string | null> | null = null;

function ngrokHeaders(): Record<string, string> {
    return environment.apiBaseUrl.includes('ngrok')
        ? { 'ngrok-skip-browser-warning': 'true' }
        : {};
}

function railwayHeaders(): Record<string, string> {
    // Agregar headers específicos para Railway
    return {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
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
                ...railwayHeaders()
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
    const baseHeaders: Record<string, string> = railwayHeaders();

    // Para login, no necesita token pero sí necesita headers correctos
    if (excludedUrls.some((url) => req.url.includes(url))) {
        return next(req.clone({ setHeaders: baseHeaders })).pipe(
            catchError((error: HttpErrorResponse) => {
                if (req.url.includes('/auth/login')) {
                    console.error('Login error:', error.status, error.message);
                    // Propagar el error para que lo maneje el componente
                    return of(
                        new HttpErrorResponse({
                            error: error.error || { message: 'No se puede conectar al backend' },
                            status: error.status,
                            statusText: error.statusText,
                            url: error.url || ''
                        })
                    );
                }
                throw error;
            })
        );
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
            throw error;
        })
    );
};

