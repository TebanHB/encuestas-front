import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.isLoggedIn() ? true : router.createUrlTree(['/auth/login']);
};

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.isLoggedIn() && authService.isAdministrador() ? true : router.createUrlTree(['/']);
};

export const encuestadorGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const allowed = authService.isLoggedIn() && (authService.isAdministrador() || authService.isEncuestador());
    return allowed ? true : router.createUrlTree(['/']);
};

export const analistaGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const allowed = authService.isLoggedIn() && (authService.isAdministrador() || authService.isAnalista());
    return allowed ? true : router.createUrlTree(['/']);
};

