import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-error',
    imports: [ButtonModule, RouterModule],
    standalone: true,
    template: `
        <div class="state-page">
            <div class="state-card">
                <span class="state-code">500</span>
                <h1>Error del sistema</h1>
                <p>Ocurrio un problema al procesar la solicitud. Intenta de nuevo o vuelve al inicio para continuar.</p>
                <p-button label="Volver al inicio" routerLink="/" severity="danger" />
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
                background: linear-gradient(180deg, #fff1f2 0%, #f8fafc 100%);
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
                color: #dc2626;
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
export class Error {}
