import { Routes } from '@angular/router';
import { adminGuard, empleadoGuard } from '../guards/auth.guard';

export default [
    {
        path: '',
        children: [
            {
                path: '',
                loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
                canActivate: [empleadoGuard]
            },
            {
                path: 'empleados',
                loadComponent: () => import('./empleados/empleados').then((m) => m.Empleados),
                canActivate: [adminGuard]
            },
            {
                path: 'encuestas/crear',
                loadComponent: () => import('./encuestas/crear-encuesta').then((m) => m.CrearEncuesta),
                canActivate: [adminGuard]
            },
            {
                path: 'encuestas/editar/:id',
                loadComponent: () => import('./encuestas/crear-encuesta').then((m) => m.CrearEncuesta),
                canActivate: [adminGuard]
            },
            {
                path: 'encuestas/historial',
                loadComponent: () => import('./encuestas/historial-encuestas').then((m) => m.HistorialEncuestas),
                canActivate: [adminGuard]
            },
            {
                path: 'encuestas/resultados',
                loadComponent: () => import('./encuestas/resultados-encuestas').then((m) => m.ResultadosEncuestas),
                canActivate: [adminGuard]
            },
            {
                path: 'encuestas/responder',
                loadComponent: () => import('./encuestas/responder-encuestas').then((m) => m.ResponderEncuestas),
                canActivate: [empleadoGuard]
            },
            {
                path: 'encuestas/responder/:id',
                loadComponent: () => import('./encuestas/responder-encuestas').then((m) => m.ResponderEncuestas),
                canActivate: [empleadoGuard]
            }
        ]
    }
] as Routes;
