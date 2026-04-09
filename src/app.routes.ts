import { Routes } from '@angular/router';
import { authGuard } from './app/core/auth/auth.guard';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/features/cies/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'pages', loadChildren: () => import('./app/features/cies/cies.routes') }
        ]
    },
    { path: 'landing', redirectTo: '/auth/login', pathMatch: 'full' },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/features/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];

