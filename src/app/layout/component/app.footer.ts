import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<footer class="layout-footer-shell">
        <div class="layout-footer">
            <div>
                <strong>Plataforma CIES de vulnerabilidad</strong>
                <div>Monitoreo institucional, entrevistas y reporteria SSR.</div>
            </div>
        </div>
    </footer>`,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                margin-top: auto;
            }
        `
    ]
})
export class AppFooter {}
