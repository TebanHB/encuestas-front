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
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div class="login-shell">
                    <div class="login-card w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20">
                        <div class="text-center mb-8">
                            <img src="/branding/cies-logo-solo.svg" alt="CIES" class="login-logo mb-6 mx-auto" />

                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenido</div>
                            <span class="text-muted-color font-medium">Inicia sesión para continuar</span>
                        </div>

                        <form (ngSubmit)="onLogin()" autocomplete="on">
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Correo</label>
                            <input
                                pInputText
                                id="email1"
                                name="email"
                                type="email"
                                placeholder="Correo electrónico"
                                class="w-full md:w-120 mb-8"
                                [(ngModel)]="email"
                                (input)="errorMessage = ''"
                                autocomplete="username"
                            />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password
                                id="password1"
                                name="password"
                                [(ngModel)]="password"
                                placeholder="Contraseña"
                                [toggleMask]="true"
                                styleClass="mb-4"
                                [fluid]="true"
                                [feedback]="false"
                                (onInput)="errorMessage = ''"
                                autocomplete="current-password"
                            ></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="rememberMe" name="rememberme" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">Recordarme</label>
                                </div>
                            </div>

                            <div *ngIf="errorMessage" class="mb-4">
                                <div class="flex items-center gap-2 text-red-500 font-medium">
                                    <i class="pi pi-exclamation-circle"></i>
                                    <span>{{ errorMessage }}</span>
                                </div>
                            </div>

                            <button
                                pButton
                                type="submit"
                                [label]="loading ? 'Ingresando...' : 'Iniciar sesión'"
                                icon="pi pi-sign-in"
                                class="w-full login-btn"
                                [disabled]="loading"
                            ></button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .login-shell {
                border-radius: 56px;
                padding: 0.3rem;
                background: linear-gradient(180deg, #0f766e 10%, rgba(33, 150, 243, 0) 30%);
            }

            .login-card {
                border-radius: 53px;
            }

            .login-logo {
                width: 5rem;
                height: 5rem;
                object-fit: contain;
                display: block;
            }

            .login-btn {
                background: #0f766e !important;
                border-color: #0f766e !important;
                color: #fff !important;
                font-weight: 700;
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
            this.errorMessage = 'Debes ingresar tu correo y contraseña.';
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

                    // Log para diagnóstico
                    console.error('Login Error Details:', {
                        status,
                        statusText: err?.statusText,
                        message: err?.message,
                        body,
                        url: err?.url
                    });

                    if (status === 401) {
                        this.errorMessage = backendMessage || 'Correo o contraseña incorrectos.';
                        this.cdr.detectChanges();
                        return;
                    }

                    if (status === 403) {
                        this.errorMessage = 'Acceso denegado. Verifica la configuración CORS del servidor.';
                        console.warn('CORS Error: El backend rechaza la solicitud desde este origen');
                        this.cdr.detectChanges();
                        return;
                    }

                    if (status === 0) {
                        this.errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté disponible.';
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
                        this.errorMessage = 'El backend no está disponible. Intenta en unos momentos.';
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
                        this.errorMessage = 'Correo o contraseña incorrectos.';
                    } else if (status === 0) {
                        this.errorMessage = 'No se pudo conectar con el servidor.';
                    } else if (status >= 500) {
                        this.errorMessage = 'Error interno del servidor.';
                    } else if (bodyText) {
                        this.errorMessage = bodyText;
                    } else {
                        this.errorMessage = `Error al iniciar sesión (${status || 'desconocido'})`;
                    }
                    this.cdr.detectChanges();
                }
            });
    }
}
