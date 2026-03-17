import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

interface UsuarioLogueado {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    rol: string;
    puedeCrearEncuestas?: boolean;
    activo?: boolean;
}

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    ngOnInit(): void {
        const usuario = this.obtenerUsuarioLogueado();
        const rol = (usuario?.rol || '').toUpperCase();

        if (rol === 'ADMIN') {
            this.model = [
                {
                    label: 'Inicio',
                    items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
                },
                {
                    label: 'Encuestas',
                    items: [
                        { label: 'Crear encuesta', icon: 'pi pi-fw pi-file-edit', routerLink: ['/pages/encuestas/crear'] },
                        { label: 'Historial de encuestas', icon: 'pi pi-fw pi-folder-open', routerLink: ['/pages/encuestas/historial'] },
                        { label: 'Resultados de encuestas', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/encuestas/resultados'] },
                        { label: 'Responder encuestas', icon: 'pi pi-fw pi-send', routerLink: ['/pages/encuestas/responder'] }
                    ]
                },
                {
                    label: 'Administración',
                    items: [{ label: 'Empleados', icon: 'pi pi-fw pi-users', routerLink: ['/pages/empleados'] }]
                }
            ];
            return;
        }

        this.model = [
            {
                label: 'Inicio',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Mis encuestas',
                items: [{ label: 'Responder encuestas', icon: 'pi pi-fw pi-send', routerLink: ['/pages/encuestas/responder'] }]
            }
        ];
    }

    private obtenerUsuarioLogueado(): UsuarioLogueado | null {
        const rawUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');

        if (!rawUser) {
            return null;
        }

        try {
            return JSON.parse(rawUser) as UsuarioLogueado;
        } catch (error) {
            console.error('No se pudo leer auth_user desde storage:', error);
            return null;
        }
    }
}