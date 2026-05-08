import { Routes } from '@angular/router';
import { adminGuard, analistaGuard, encuestadorGuard } from '../../core/auth/auth.guard';

export default [
    {
        path: '',
        children: [
            {
                path: 'usuarios',
                loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.UsuariosPage),
                canActivate: [adminGuard]
            },
            {
                path: 'metodologia',
                loadComponent: () => import('./pages/metodologia/metodologia').then((m) => m.MetodologiaPage),
                canActivate: [adminGuard]
            },
            {
                path: 'seleccion',
                loadComponent: () => import('./pages/seleccion/seleccion').then((m) => m.SeleccionPage),
                canActivate: [adminGuard]
            },
            {
                path: 'entrevistas',
                loadComponent: () => import('./pages/entrevistas/entrevistas').then((m) => m.EntrevistasPage),
                canActivate: [encuestadorGuard]
            },
            {
                path: 'reporteria',
                loadComponent: () => import('./pages/reporteria/reporteria').then((m) => m.ReporteriaPage),
                canActivate: [analistaGuard]
            },
            {
                path: 'auditoria',
                loadComponent: () => import('./pages/auditoria/auditoria').then((m) => m.AuditoriaPage),
                canActivate: [adminGuard]
            }
        ]
    }
] as Routes;

