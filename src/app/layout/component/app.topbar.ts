import { LayoutService } from '@/app/layout/service/layout.service';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { StyleClassModule } from 'primeng/styleclass';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>

            <a class="layout-topbar-logo" routerLink="/">
                <img src="/branding/cies-logo-no-bg.svg" alt="CIES" class="topbar-logo-image" />
                <div class="topbar-brand-copy">
                    <strong>Vulnerabilidad CIES</strong>
                    <span>Operación institucional</span>
                </div>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="topbar-identity" *ngIf="currentUser">
                <strong>{{ currentUser.nombre }} {{ currentUser.apellido || '' }}</strong>
                <span>{{ currentRoleLabel }}</span>
            </div>

            <a *ngIf="quickActionLabel" [routerLink]="quickActionRoute" class="topbar-quick-link">
                <button type="button" class="layout-topbar-action layout-topbar-action-highlight topbar-quick-action">
                    <i class="pi pi-arrow-right"></i>
                    <span>{{ quickActionLabel }}</span>
                </button>
            </a>

            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action layout-topbar-action-highlight" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-sun': layoutService.isDarkTheme(), 'pi-moon': !layoutService.isDarkTheme() }"></i>
                </button>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                pStyleClass="@next"
                enterFromClass="hidden"
                enterActiveClass="animate-scalein"
                leaveToClass="hidden"
                leaveActiveClass="animate-fadeout"
                [hideOnOutsideClick]="true"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action" (click)="logout()">
                        <i class="pi pi-sign-out"></i>
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`,
    styles: [
        `
            :host {
                display: block;
                padding: var(--layout-topbar-offset) clamp(0.75rem, 2vw, 1.5rem) 0;
            }

            .topbar-logo-image {
                height: 2.6rem;
                width: auto;
                display: block;
                object-fit: contain;
            }

            .topbar-quick-link {
                display: inline-flex;
            }

            .topbar-quick-action {
                width: auto;
                padding: 0 1rem;
                gap: 0.45rem;
            }

            .topbar-quick-action span {
                display: inline;
                font-size: 0.9rem;
            }

            @media (max-width: 991px) {
                :host {
                    padding: var(--layout-topbar-offset) 0.75rem 0;
                }
            }
        `
    ]
})
export class AppTopbar {
    layoutService = inject(LayoutService);
    private authService = inject(AuthService);
    private router = inject(Router);

    get currentUser() {
        return this.authService.getUser();
    }

    get currentRoleLabel(): string {
        if (this.authService.isAdministrador()) {
            return 'Configura y supervisa';
        }

        if (this.authService.isEncuestador()) {
            return 'Aplica entrevistas';
        }

        if (this.authService.isAnalista()) {
            return 'Analiza resultados';
        }

        return this.currentUser?.rol || '';
    }

    get quickActionLabel(): string {
        if (this.authService.isAdministrador()) {
            return 'Registrar personas';
        }

        if (this.authService.isEncuestador()) {
            return 'Entrevistar ahora';
        }

        if (this.authService.isAnalista()) {
            return 'Ver resultados';
        }

        return '';
    }

    get quickActionRoute(): string {
        if (this.authService.isAdministrador()) {
            return '/pages/seleccion';
        }

        if (this.authService.isEncuestador()) {
            return '/pages/entrevistas';
        }

        if (this.authService.isAnalista()) {
            return '/pages/reporteria';
        }

        return '/';
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    logout(): void {
        this.authService.logout();
        void this.router.navigate(['/auth/login']);
    }
}

