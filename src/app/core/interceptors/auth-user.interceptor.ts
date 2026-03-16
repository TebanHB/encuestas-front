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

export const authUserInterceptor: HttpInterceptorFn = (req, next) => {
    const rawUser = localStorage.getItem('auth_user');

    if (!rawUser) {
        return next(req);
    }

    try {
        const usuario = JSON.parse(rawUser) as UsuarioLogueado;

        const cloned = req.clone({
            setHeaders: {
                'X-User-Role': usuario.rol || '',
                'X-User-Email': usuario.email || ''
            }
        });

        return next(cloned);
    } catch {
        return next(req);
    }
};
