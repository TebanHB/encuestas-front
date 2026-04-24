import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../../layout/component/app.floatingconfigurator';
import { AuthService, LoginResponse } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator class="login-configurator" />
        <div class="login-page">
            <main class="login-shell" aria-label="Inicio de sesion">
                <section class="login-card">
                    <header class="login-header">
                        <img src="/branding/cies-logo-solo.svg" alt="CIES" class="login-logo" />
                        <p class="login-kicker">CIES</p>
                        <h1>Bienvenido</h1>
                        <p>Inicia sesion para continuar</p>
                    </header>

                    <form class="login-form" (ngSubmit)="onLogin()" autocomplete="on">
                        <div class="login-field">
                            <label for="email1">Correo</label>
                            <input
                                pInputText
                                id="email1"
                                name="email"
                                type="email"
                                placeholder="Correo electronico"
                                class="w-full"
                                [(ngModel)]="email"
                                (input)="errorMessage = ''"
                                autocomplete="username"
                            />
                        </div>

                        <div class="login-field">
                            <label for="password1">Contrasena</label>
                            <p-password
                                id="password1"
                                name="password"
                                [(ngModel)]="password"
                                placeholder="Contrasena"
                                [toggleMask]="true"
                                styleClass="w-full"
                                inputStyleClass="w-full"
                                [fluid]="true"
                                [feedback]="false"
                                (onInput)="errorMessage = ''"
                                autocomplete="current-password"
                            ></p-password>
                        </div>

                        <div class="login-options">
                            <div class="login-remember">
                                <p-checkbox [(ngModel)]="rememberMe" name="rememberme" id="rememberme1" binary></p-checkbox>
                                <label for="rememberme1">Recordarme</label>
                            </div>
                        </div>

                        <div *ngIf="errorMessage" class="login-error">
                            <i class="pi pi-exclamation-circle"></i>
                            <span>{{ errorMessage }}</span>
                        </div>

                        <button
                            pButton
                            type="submit"
                            [label]="loading ? 'Ingresando...' : 'Iniciar sesion'"
                            icon="pi pi-sign-in"
                            class="w-full login-btn"
                            [disabled]="loading"
                        ></button>
                    </form>
                </section>
            </main>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                min-height: 100dvh;
            }

            :host ::ng-deep .login-configurator > div {
                z-index: 5;
            }

            .login-page {
                min-height: 100dvh;
                width: 100%;
                display: grid;
                place-items: center;
                padding: clamp(1rem, 4vw, 2rem);
                background:
                    radial-gradient(circle at 18% 14%, rgba(20, 184, 166, 0.16), transparent 28rem),
                    linear-gradient(145deg, var(--surface-50), var(--surface-100));
                overflow: auto;
            }

            .login-shell {
                width: min(100%, 30rem);
            }

            .login-card {
                width: 100%;
                padding: clamp(1.5rem, 5vw, 3.25rem);
                border-radius: 1.35rem;
                background: color-mix(in srgb, var(--surface-card) 96%, transparent);
                border: 1px solid color-mix(in srgb, var(--surface-border) 74%, transparent);
                box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
                backdrop-filter: blur(16px);
            }

            .login-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 0.45rem;
                margin-bottom: 1.75rem;
            }

            .login-logo {
                width: 4.6rem;
                height: 4.6rem;
                object-fit: contain;
                display: block;
                margin-bottom: 0.35rem;
            }

            .login-kicker {
                margin: 0;
                color: #0f766e;
                font-size: 0.76rem;
                font-weight: 800;
                letter-spacing: 0.16em;
            }

            .login-header h1 {
                margin: 0;
                color: var(--text-color);
                font-size: clamp(1.7rem, 5vw, 2.15rem);
                line-height: 1.1;
                font-weight: 800;
            }

            .login-header p:not(.login-kicker) {
                margin: 0;
                color: var(--text-color-secondary);
                font-weight: 600;
            }

            .login-form,
            .login-field {
                display: flex;
                flex-direction: column;
            }

            .login-form {
                gap: 1rem;
            }

            .login-field {
                gap: 0.45rem;
            }

            .login-field label {
                color: var(--text-color);
                font-size: 0.92rem;
                font-weight: 700;
            }

            :host ::ng-deep .login-field .p-inputtext,
            :host ::ng-deep .login-field .p-password-input {
                min-height: 2.9rem;
                border-radius: 0.85rem;
                font-size: 1rem;
            }

            .login-options {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                min-height: 1.8rem;
            }

            .login-remember {
                display: flex;
                align-items: center;
                gap: 0.55rem;
                color: var(--text-color-secondary);
                font-weight: 600;
            }

            .login-error {
                display: flex;
                align-items: flex-start;
                gap: 0.55rem;
                padding: 0.75rem 0.85rem;
                border-radius: 0.85rem;
                background: color-mix(in srgb, #ef4444 10%, transparent);
                color: #dc2626;
                font-weight: 700;
                line-height: 1.35;
            }

            .login-btn {
                min-height: 2.9rem;
                background: #0f766e !important;
                border-color: #0f766e !important;
                color: #fff !important;
                font-weight: 700;
                border-radius: 0.9rem;
                transition: all 0.2s ease;
            }

            .login-btn:hover {
                background: #0d6b63 !important;
                border-color: #0d6b63 !important;
            }

            .login-btn:disabled {
                background: #9ca3af !important;
                border-color: #9ca3af !important;
                opacity: 0.7;
            }

            @media (max-width: 520px) {
                :host ::ng-deep .login-configurator {
                    display: none;
                }

                .login-page {
                    place-items: start center;
                    padding: 0.9rem;
                    background: var(--surface-ground);
                }

                .login-shell {
                    width: 100%;
                    min-height: calc(100dvh - 1.8rem);
                    display: flex;
                    align-items: center;
                }

                .login-card {
                    padding: 1.25rem;
                    border-radius: 1.05rem;
                    box-shadow: 0 14px 38px rgba(15, 23, 42, 0.1);
                }

                .login-logo {
                    width: 4rem;
                    height: 4rem;
                }

                .login-header {
                    gap: 0.35rem;
                    margin-bottom: 1.25rem;
                }

                .login-header h1 {
                    font-size: 1.65rem;
                }

                .login-header p:not(.login-kicker) {
                    font-size: 0.92rem;
                }

                .login-form {
                    gap: 0.85rem;
                }

                :host ::ng-deep .login-field .p-inputtext,
                :host ::ng-deep .login-field .p-password-input,
                .login-btn {
                    min-height: 2.75rem;
                }
            }

            @media (max-width: 360px) {
                .login-page {
                    padding: 0.65rem;
                }

                .login-shell {
                    min-height: calc(100dvh - 1.3rem);
                }

                .login-card {
                    padding: 1rem;
                }

                .login-logo {
                    width: 3.5rem;
                    height: 3.5rem;
                }
            }
        `
    ]
})
export class Login {
    private authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    email = '';
    password = '';
    rememberMe = false;
    loading = false;
    errorMessage = '';

    onLogin(): void {
        this.errorMessage = '';
        this.cdr.detectChanges();

        if (!this.email.trim() || !this.password.trim()) {
            this.errorMessage = 'Debes ingresar tu correo y contrasena.';
            this.cdr.detectChanges();
            return;
        }

        if (this.loading) {
            return;
        }

        this.loading = true;
        this.cdr.detectChanges();

        this.authService
            .login({
                email: this.email.trim().toLowerCase(),
                password: this.password
            })
            .subscribe({
                next: (response: LoginResponse) => {
                    this.authService.persistSession(response, this.rememberMe);
                    const role = (response.user.rol || '').toUpperCase();
                    void this.router.navigate([role === 'ANALISTA' ? '/pages/reporteria' : role === 'ENCUESTADOR' ? '/pages/entrevistas' : '/']);
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    const status = err?.status;
                    const body = err?.error;
                    const bodyText = typeof body === 'string' ? body : '';
                    const bodyMessage = typeof body?.message === 'string' ? body.message : '';
                    const backendMessage = bodyText || bodyMessage;

                    console.error('Login Error Details:', {
                        status,
                        statusText: err?.statusText,
                        message: err?.message,
                        body,
                        url: err?.url
                    });

                    if (status === 401) {
                        this.errorMessage = backendMessage || 'Correo o contrasena incorrectos.';
                        this.cdr.detectChanges();
                        return;
                    }

                    if (status === 403) {
                        this.errorMessage = 'Acceso denegado. Verifica la configuracion CORS del servidor.';
                        console.warn('CORS Error: El backend rechaza la solicitud desde este origen');
                        this.cdr.detectChanges();
                        return;
                    }

                    if (status === 0) {
                        this.errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend este disponible.';
                        console.warn('Connection Error: No se puede alcanzar el backend');
                        this.cdr.detectChanges();
                        return;
                    }

                    if (status === 404) {
                        this.errorMessage = 'Endpoint no encontrado. Verifica la URL del backend.';
                        this.cdr.detectChanges();
                        return;
                    }

                    if (status === 504 || status === 503 || status === 502) {
                        this.errorMessage = 'El backend no esta disponible. Intenta en unos momentos.';
                        console.error('Backend Unavailable:', status);
                        this.cdr.detectChanges();
                        return;
                    }

                    if (status >= 500) {
                        this.errorMessage = backendMessage || 'Error interno del servidor.';
                        this.cdr.detectChanges();
                        return;
                    }

                    if (backendMessage) {
                        this.errorMessage = backendMessage;
                        this.cdr.detectChanges();
                        return;
                    }

                    if (status === 401) {
                        this.errorMessage = 'Correo o contrasena incorrectos.';
                    } else if (status === 0) {
                        this.errorMessage = 'No se pudo conectar con el servidor.';
                    } else if (status >= 500) {
                        this.errorMessage = 'Error interno del servidor.';
                    } else if (bodyText) {
                        this.errorMessage = bodyText;
                    } else {
                        this.errorMessage = `Error al iniciar sesion (${status || 'desconocido'})`;
                    }
                    this.cdr.detectChanges();
                }
            });
    }
}
