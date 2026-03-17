import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

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

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        return true;
    }

    return router.createUrlTree(['/auth/login']);
};

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const usuario = obtenerUsuarioDesdeStorage();

    if (!authService.isLoggedIn()) {
        return router.createUrlTree(['/auth/login']);
    }

    if (!usuario) {
        return router.createUrlTree(['/auth/login']);
    }

    if ((usuario.rol || '').toUpperCase() !== 'ADMIN') {
        return router.createUrlTree(['/']);
    }

    return true;
};

export const empleadoGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const usuario = obtenerUsuarioDesdeStorage();

    if (!authService.isLoggedIn()) {
        return router.createUrlTree(['/auth/login']);
    }

    if (!usuario) {
        return router.createUrlTree(['/auth/login']);
    }

    const rol = (usuario.rol || '').toUpperCase();

    if (rol !== 'ADMIN' && rol !== 'EMPLEADO') {
        return router.createUrlTree(['/auth/login']);
    }

    return true;
};