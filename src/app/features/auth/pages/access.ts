import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [ButtonModule, RouterModule],
    template: `
        <div class="state-page">
            <div class="state-card">
                <span class="state-code">403</span>
                <h1>Acceso restringido</h1>
                <p>No tienes permisos para entrar a esta sección. Si crees que es un error, solicita revisión al administrador.</p>
                <p-button label="Volver al inicio" routerLink="/" severity="warn" />
            </div>
        </div>
    `,
    styles: [
        `
            .state-page {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
                background: linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%);
            }

            .state-card {
                width: min(100%, 32rem);
                padding: 2rem;
                border-radius: 1.5rem;
                background: #ffffff;
                box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
                text-align: center;
            }

            .state-code {
                display: inline-block;
                margin-bottom: 0.75rem;
                font-size: 2rem;
                font-weight: 800;
                color: #d97706;
            }

            h1 {
                margin: 0 0 0.75rem;
                color: #0f172a;
            }

            p {
                color: #475569;
                margin: 0 0 1rem;
            }
        `
    ]
})
export class Access {}
