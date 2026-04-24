import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { AuthService } from '../../../../core/auth/auth.service';
import { NombrePropioPipe } from '../../../../shared/pipes/formato.pipe';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, UsuarioAdmin, UsuarioUpsertRequest } from '../../services/cies.service';

@Component({
    selector: 'app-usuarios-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, DialogModule, InputTextModule, PasswordModule, SelectModule, TableModule, TagModule, Toast, NombrePropioPipe, CiesInfoHintComponent],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--azul">Administración</div>
                    <h1 class="cies-hero__title">Usuarios del sistema</h1>
                    <p class="cies-hero__copy">Gestiona administradores, encuestadores y analistas con bloqueo, activación y cambio de rol.</p>
                </div>
                <div class="cies-hero__actions">
                    <button pButton type="button" icon="pi pi-plus" label="Crear usuario" (click)="openCreate()"></button>
                </div>
            </section>

            <section class="cies-guidance-grid">
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">1</div>
                    <div class="cies-stack">
                        <h4>Administrador</h4>
                        <p>Configura metodología, registra personas, supervisa entrevistas y gestiona usuarios.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">2</div>
                    <div class="cies-stack">
                        <h4>Encuestador</h4>
                        <p>Registra personas individuales si hace falta y aplica entrevistas de campo.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">3</div>
                    <div class="cies-stack">
                        <h4>Analista</h4>
                        <p>Revisa resultados, compara sedes y exporta reportes sin tocar la operación diaria.</p>
                    </div>
                </article>
            </section>

            <section class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Control de accesos</h3>
                            <p>Administra cuentas, roles operativos y bloqueos de ingreso del sistema.</p>
                        </div>
                        <app-cies-info-hint text="Desde este bloque puedes crear usuarios, ajustar su rol y reactivar cuentas cuando sea necesario."></app-cies-info-hint>
                    </div>
                </div>
                <div *ngIf="!loadingUsuarios && !totalUsuarios" class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <h3>Aún no hay usuarios creados</h3>
                    <p>Crea primero las cuentas del equipo y asigna un rol simple: administrador, encuestador o analista.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Crear primer usuario" icon="pi pi-plus" (click)="openCreate()"></button>
                    </div>
                </div>

                <p-table *ngIf="totalUsuarios" [value]="usuarios" [tableStyle]="{ 'min-width': '64rem' }"
                    responsiveLayout="scroll" [paginator]="true" [lazy]="true" [rows]="usuariosRows"
                    [first]="usuariosPage * usuariosRows" [totalRecords]="totalUsuarios"
                    [rowsPerPageOptions]="[10, 20, 50]" [loading]="loadingUsuarios"
                    (onLazyLoad)="onUsuariosLazyLoad($any($event))" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Bloqueo</th>
                            <th>Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-user>
                        <tr>
                            <td>{{ user.id }}</td>
                            <td>{{ user.nombre | nombrePropio }} {{ user.apellido | nombrePropio }}</td>
                            <td>{{ user.email }}</td>
                            <td><p-tag [value]="user.rol" [severity]="user.rol === 'ADMINISTRADOR' ? 'danger' : user.rol === 'ENCUESTADOR' ? 'info' : 'warn'"></p-tag></td>
                            <td><p-tag [value]="user.activo ? 'Activo' : 'Inactivo'" [severity]="user.activo ? 'success' : 'secondary'"></p-tag></td>
                            <td>{{ user.bloqueadoHasta || 'Sin bloqueo' }}</td>
                            <td>
                                <div class="cies-inline-actions">
                                    <button pButton type="button" icon="pi pi-pencil" text rounded severity="info" (click)="openEdit(user)"></button>
                                    <button
                                        pButton
                                        type="button"
                                        [icon]="user.activo ? 'pi pi-lock' : 'pi pi-lock-open'"
                                        text
                                        rounded
                                        severity="contrast"
                                        (click)="toggleEstado(user)"
                                    ></button>
                                    <button pButton type="button" icon="pi pi-trash" text rounded severity="danger" (click)="remove(user)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>

        <p-toast></p-toast>

        <p-dialog
            [(visible)]="showDialog"
            [modal]="true"
            [style]="{ width: '36rem', 'max-width': '96vw' }"
            [contentStyle]="{ overflow: 'visible' }"
            [draggable]="false"
            [resizable]="false"
            [header]="editingId ? 'Editar usuario' : 'Nuevo usuario'"
            styleClass="cies-dialog"
        >
            <div class="cies-soft-note">
                Usa <strong>Administrador</strong> para configuración y control, <strong>Encuestador</strong> para aplicar entrevistas y <strong>Analista</strong> para revisar resultados.
            </div>

            <div class="cies-form-grid cies-form-grid--two cies-dialog-form">
                <div>
                    <label>Nombre <span style="color:#dc2626;font-weight:700">*</span></label>
                    <input pInputText [(ngModel)]="form.nombre" class="w-full" placeholder="Ej. María" />
                </div>
                <div>
                    <label>Apellido</label>
                    <input pInputText [(ngModel)]="form.apellido" class="w-full" placeholder="Ej. López" />
                </div>
                <div>
                    <label>Correo <span style="color:#dc2626;font-weight:700">*</span></label>
                    <input pInputText [(ngModel)]="form.email" type="email" class="w-full" placeholder="correo@dominio.com" />
                </div>
                <div>
                    <label>Rol <span style="color:#dc2626;font-weight:700">*</span></label>
                    <p-select [options]="roles" [(ngModel)]="form.rol" optionLabel="label" optionValue="value" appendTo="body" class="w-full"></p-select>
                </div>
                <div class="cies-field--full">
                    <label>
                        <p-checkbox [(ngModel)]="form.activo" [binary]="true" inputId="usuario-activo"></p-checkbox>
                        Usuario activo (puede iniciar sesión)
                    </label>
                </div>
                <div *ngIf="!editingId" class="cies-field--full">
                    <label>Contraseña <span style="color:#dc2626;font-weight:700">*</span></label>
                    <p-password [(ngModel)]="form.password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" placeholder="Mínimo 5 caracteres"></p-password>
                </div>
                <div *ngIf="editingId" class="cies-field--full">
                    <label>Nueva contraseña (opcional)</label>
                    <p-password [(ngModel)]="form.password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" placeholder="Dejar vacío para mantener la actual"></p-password>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="showDialog = false"></button>
                <button pButton type="button" label="Guardar" (click)="save()"></button>
            </ng-template>
        </p-dialog>
    `,
    styles: [``]
})
export class UsuariosPage implements OnInit {
    private authService = inject(AuthService);
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);
    private router = inject(Router);

    usuarios: UsuarioAdmin[] = [];
    totalUsuarios = 0;
    usuariosPage = 0;
    usuariosRows = 10;
    loadingUsuarios = false;
    showDialog = false;
    editingId: number | null = null;

    form: UsuarioUpsertRequest = {
        nombre: '',
        apellido: '',
        email: '',
        rol: 'ENCUESTADOR',
        activo: true,
        password: ''
    };

    roles = [
        { label: 'Administrador', value: 'ADMINISTRADOR' },
        { label: 'Encuestador', value: 'ENCUESTADOR' },
        { label: 'Analista', value: 'ANALISTA' }
    ];

    ngOnInit(): void {
        this.load();
    }

    load(page = this.usuariosPage, size = this.usuariosRows): void {
        this.loadingUsuarios = true;
        this.ciesService.listUsuariosPaginado(page, size).subscribe({
            next: (response) => {
                if (!response.content.length && response.totalElements > 0 && page > 0) {
                    this.load(page - 1, size);
                    return;
                }

                this.usuarios = response.content;
                this.totalUsuarios = response.totalElements;
                this.usuariosPage = response.page;
                this.usuariosRows = response.size;
                this.loadingUsuarios = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.loadingUsuarios = false;
                console.error('Error loading users:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(error, 'No se pudieron cargar los usuarios') });
            }
        });
    }

    onUsuariosLazyLoad(event: { first?: number; rows?: number }): void {
        const rows = event.rows || this.usuariosRows;
        const page = Math.floor((event.first || 0) / rows);
        this.load(page, rows);
    }

    openCreate(): void {
        this.editingId = null;
        this.form = { nombre: '', apellido: '', email: '', rol: 'ENCUESTADOR', activo: true, password: '' };
        this.showDialog = true;
    }

    openEdit(user: UsuarioAdmin): void {
        this.editingId = user.id;
        this.form = {
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rol: user.rol,
            activo: user.activo,
            password: ''
        };
        this.showDialog = true;
    }

    save(): void {
        const nombre = this.form.nombre?.trim() || '';
        const apellido = this.form.apellido?.trim() || '';
        const email = this.form.email?.trim().toLowerCase() || '';
        const rol = this.form.rol?.trim() || 'ENCUESTADOR';
        const password = this.form.password?.trim() || '';

        if (!nombre || !email) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Nombre y correo son obligatorios' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.messageService.add({ severity: 'warn', summary: 'Correo inválido', detail: 'Ingresa un correo electrónico válido' });
            return;
        }

        if (!this.editingId && password.length < 5) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La contraseña debe tener al menos 5 caracteres' });
            return;
        }

        if (this.editingId && password && password.length < 5) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Si cambias la contraseña debe tener al menos 5 caracteres' });
            return;
        }

        const payload: UsuarioUpsertRequest = {
            nombre,
            apellido,
            email,
            rol,
            activo: this.form.activo !== false,
            password: password || undefined
        };

        const request$ = this.editingId ? this.ciesService.updateUsuario(this.editingId, payload) : this.ciesService.createUsuario(payload);
        request$.subscribe({
            next: () => {
                this.showDialog = false;
                this.cdr.detectChanges();
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: this.editingId ? 'Usuario actualizado' : 'Usuario creado',
                    detail: `${payload.nombre} ${payload.apellido}`.trim() + ' guardado correctamente.'
                });
            },
            error: (error) => {
                console.error('Error saving user:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error al guardar',
                    detail: this.extractErrorMessage(error, 'No se pudo guardar el usuario')
                });
            }
        });
    }

    toggleEstado(user: UsuarioAdmin): void {
        const nuevoEstado = !user.activo;
        this.ciesService.toggleUsuario(user.id, nuevoEstado).subscribe({
            next: () => {
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Estado actualizado',
                    detail: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`
                });
            },
            error: (error) => {
                console.error('Error toggling user state:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(error, 'No se pudo actualizar el estado del usuario') });
            }
        });
    }

    remove(user: UsuarioAdmin): void {
        const isCurrentUser = this.authService.getUser()?.id === user.id;
        const confirmationMessage = isCurrentUser
            ? `Se eliminará tu propia cuenta (${user.nombre} ${user.apellido}) y se cerrará la sesión. ¿Deseas continuar?`
            : `Se eliminará la cuenta de ${user.nombre} ${user.apellido}. Esta acción la ocultará del sistema. ¿Deseas continuar?`;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        this.ciesService.deleteUsuario(user.id).subscribe({
            next: () => {
                if (isCurrentUser) {
                    this.authService.clearSession();
                    void this.router.navigate(['/auth/login']);
                    return;
                }

                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Eliminado',
                    detail: `Usuario ${user.nombre} eliminado correctamente`
                });
            },
            error: (error) => {
                console.error('Error deleting user:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(error, 'No se pudo eliminar el usuario') });
            }
        });
    }

    private extractErrorMessage(error: unknown, fallback: string): string {
        const wrapper = error as {
            error?: { message?: string; detail?: string; error?: string } | string;
            message?: string;
        } | null;
        const payload = wrapper?.error;

        if (typeof payload === 'string' && payload.trim()) {
            return payload;
        }

        if (typeof payload === 'object' && payload) {
            if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
            if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
            if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
        }

        if (wrapper?.message && typeof wrapper.message === 'string') return wrapper.message;

        return fallback;
    }
}

