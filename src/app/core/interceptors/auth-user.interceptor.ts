import { HttpInterceptorFn } from '@angular/common/http';

interface UsuarioLogueado {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    puedeCrearEncuestas: boolean;
    activo: boolean;
}

function obtenerUsuarioDesdeStorage(): UsuarioLogueado | null {
    const rawUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');

    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser) as UsuarioLogueado;
    } catch {
        return null;
    }
}

export const authUserInterceptor: HttpInterceptorFn = (req, next) => {
    const usuario = obtenerUsuarioDesdeStorage();

    if (!usuario) {
        return next(req);
    }

    const cloned = req.clone({
        setHeaders: {
            'X-User-Role': usuario.rol || '',
            'X-User-Email': usuario.email || ''
        }
    });

    return next(cloned);
};
