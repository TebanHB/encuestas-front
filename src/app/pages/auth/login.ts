import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService, LoginResponse } from '../../service/auth.service';

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
                            <img src="/demo/images/Imagenes PNG CIES/cies-logo-solo.svg" alt="CIES" class="login-logo mb-6 mx-auto" />

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
                                autocomplete="current-password"
                            ></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="checked" name="rememberme" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">Recordarme</label>
                                </div>
                            </div>

                            <div *ngIf="errorMessage" class="mb-4 text-red-500 font-medium">
                                {{ errorMessage }}
                            </div>

                            <button
                                pButton
                                type="submit"
                                [label]="loading ? 'Ingresando...' : 'Iniciar sesión'"
                                icon="pi pi-sign-in"
                                class="w-full"
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
                background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%);
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
        `
    ]
})
export class Login {
    private authService = inject(AuthService);
    private router = inject(Router);

    email: string = '';
    password: string = '';
    checked: boolean = false;
    loading: boolean = false;
    errorMessage: string = '';

    onLogin(): void {
        this.errorMessage = '';

        if (!this.email.trim() || !this.password.trim()) {
            this.errorMessage = 'Debes ingresar tu correo y contraseña.';
            return;
        }

        if (this.loading) {
            return;
        }

        this.loading = true;

        this.authService
            .login({
                email: this.email.trim(),
                password: this.password
            })
            .subscribe({
                next: (response: LoginResponse) => {
                    this.authService.persistSession(response.token, response.user, this.checked);

                    const rol = (response.user.rol || '').toUpperCase();

                    if (rol === 'ADMIN') {
                        void this.router.navigate(['/']);
                    } else if (rol === 'EMPLEADO') {
                        void this.router.navigate(['/']);
                    } else {
                        void this.router.navigate(['/']);
                    }

                    this.loading = false;
                },
                error: (error: HttpErrorResponse) => {
                    console.error('Error en login:', error);

                    if (error.status === 401) {
                        this.errorMessage = 'Correo o contraseña incorrectos.';
                    } else if (error.status === 0) {
                        this.errorMessage = 'No se pudo conectar con el servidor.';
                    } else {
                        this.errorMessage = 'Ocurrió un error al iniciar sesión.';
                    }

                    this.loading = false;
                }
            });
    }
}