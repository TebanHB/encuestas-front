import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';
import { AppMenuitem } from './app.menuitem';

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
    private authService = inject(AuthService);

    ngOnInit(): void {
        const rol = (this.authService.getRole() || '').toUpperCase();

        if (rol === 'ADMINISTRADOR') {
            this.model = [
                {
                    label: 'Empieza aquí',
                    items: [{ label: 'Resumen general', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
                },
                {
                    label: 'Tareas del día',
                    items: [
                        { label: 'Configurar preguntas y puntajes', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/pages/metodologia'] },
                        { label: 'Registrar personas', icon: 'pi pi-fw pi-share-alt', routerLink: ['/pages/seleccion'] },
                        { label: 'Aplicar entrevistas', icon: 'pi pi-fw pi-file-edit', routerLink: ['/pages/entrevistas'] },
                        { label: 'Ver resultados', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/reporteria'] }
                    ]
                },
                {
                    label: 'Administrar',
                    items: [
                        { label: 'Administrar usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/pages/usuarios'] },
                        { label: 'Revisar auditoría', icon: 'pi pi-fw pi-shield', routerLink: ['/pages/auditoria'] }
                    ]
                }
            ];
            return;
        }

        if (rol === 'ENCUESTADOR') {
            this.model = [
                {
                    label: 'Empieza aquí',
                    items: [{ label: 'Resumen general', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
                },
                {
                    label: 'Trabajo diario',
                    items: [{ label: 'Entrevistar ahora', icon: 'pi pi-fw pi-file-edit', routerLink: ['/pages/entrevistas'] }]
                }
            ];
            return;
        }

        this.model = [
            {
                label: 'Empieza aquí',
                items: [{ label: 'Resumen general', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Resultados',
                items: [{ label: 'Ver resultados y exportar', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/reporteria'] }]
            }
        ];
    }
}

