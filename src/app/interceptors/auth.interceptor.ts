import { HttpInterceptorFn } from '@angular/common/http';

interface AuthUser {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    rol: string;
    puedeCrearEncuestas?: boolean;
    activo?: boolean;
}

function getAuthToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function getAuthUser(): AuthUser | null {
    const rawUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');

    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser) as AuthUser;
    } catch {
        return null;
    }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = getAuthToken();
    const user = getAuthUser();

    const headers: Record<string, string> = {};

    headers['ngrok-skip-browser-warning'] = 'true';

    const excludedUrls = ['/auth/login', '/auth/register'];
    const isExcluded = excludedUrls.some((url) => req.url.includes(url));

    if (!isExcluded) {
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (user?.rol) {
            headers['X-User-Role'] = user.rol;
        }

        if (user?.email) {
            headers['X-User-Email'] = user.email;
        }
    }

    const authReq = req.clone({
        setHeaders: headers
    });

    return next(authReq);
};