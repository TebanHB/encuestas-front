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
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../../../core/auth/auth.service';
import { NombrePropioPipe } from '../../../../shared/pipes/formato.pipe';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, UsuarioAdmin, UsuarioUpsertRequest } from '../../services/cies.service';

@Component({
    selector: 'app-usuarios-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, ConfirmDialogModule, DialogModule, InputTextModule, PasswordModule, SelectModule, TableModule, TagModule, Toast, TooltipModule, NombrePropioPipe, CiesInfoHintComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--azul">Administración</div>
                    <h1 class="cies-hero__title">Usuarios del sistema</h1>
                    <p class="cies-hero__copy">Gestiona administradores, encuestadores y analistas con activación y cambio de rol.</p>
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
                            <p>Administra cuentas, roles operativos y estados de acceso del sistema.</p>
                        </div>
                        <app-cies-info-hint text="Desde este bloque puedes crear usuarios, ajustar su rol y reactivar cuentas cuando sea necesario."></app-cies-info-hint>
                    </div>
                </div>

                <!-- Buscador y resumen -->
                <div class="usuarios-toolbar" *ngIf="totalUsuarios || filtroBusqueda">
                    <span class="p-input-icon-left usuarios-toolbar__search">
                        <i class="pi pi-search"></i>
                        <input pInputText type="text" [(ngModel)]="filtroBusqueda"
                               placeholder="Buscar por nombre, apellido o correo"
                               (keyup.enter)="aplicarBusqueda()" />
                    </span>
                    <div class="usuarios-toolbar__chips">
                        <p-tag [value]="totalUsuarios + ' usuarios'" severity="info"></p-tag>
                        <p-tag *ngIf="filtroBusqueda" [value]="usuariosFiltrados.length + ' coinciden'" severity="contrast"></p-tag>
                    </div>
                </div>

                <div *ngIf="!loadingUsuarios && !totalUsuarios" class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <h3>Aún no hay usuarios creados</h3>
                    <p>Crea primero las cuentas del equipo y asigna un rol: administrador, encuestador o analista.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Crear primer usuario" icon="pi pi-plus" (click)="openCreate()"></button>
                    </div>
                </div>

                <p-table *ngIf="totalUsuarios" [value]="usuariosFiltrados" [tableStyle]="{ 'min-width': '60rem' }"
                    responsiveLayout="stack" [breakpoint]="'960px'"
                    [paginator]="!filtroBusqueda" [lazy]="!filtroBusqueda" [rows]="usuariosRows"
                    [first]="usuariosPage * usuariosRows" [totalRecords]="totalUsuarios"
                    [rowsPerPageOptions]="[10, 20, 50]" [loading]="loadingUsuarios"
                    (onLazyLoad)="onUsuariosLazyLoad($any($event))" class="cies-table usuarios-table"
                    [globalFilterFields]="['nombre','apellido','email','rol']">
                    <ng-template pTemplate="header">
                        <tr>
                            <th style="width: 4rem">ID</th>
                            <th>Nombre completo</th>
                            <th>Correo</th>
                            <th style="width: 9rem">Rol</th>
                            <th style="width: 7rem">Estado</th>
                            <th style="width: 11rem; text-align: right">Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-user>
                        <tr>
                            <td><span class="p-column-title">ID</span>{{ user.id }}</td>
                            <td>
                                <span class="p-column-title">Nombre completo</span>
                                <div class="usuario-cell">
                                    <strong>{{ user.nombre | nombrePropio }} {{ user.apellido | nombrePropio }}</strong>
                                </div>
                            </td>
                            <td><span class="p-column-title">Correo</span>{{ user.email }}</td>
                            <td>
                                <span class="p-column-title">Rol</span>
                                <p-tag [value]="formatearRol(user.rol)" [severity]="severidadRol(user.rol)"></p-tag>
                            </td>
                            <td>
                                <span class="p-column-title">Estado</span>
                                <p-tag [value]="user.activo ? 'Activo' : 'Inactivo'" [severity]="user.activo ? 'success' : 'secondary'"
                                       [icon]="user.activo ? 'pi pi-check' : 'pi pi-ban'"></p-tag>
                            </td>
                            <td style="text-align: right">
                                <span class="p-column-title">Acciones</span>
                                <div class="cies-inline-actions">
                                    <button pButton type="button" icon="pi pi-pencil" text rounded severity="info"
                                            pTooltip="Editar usuario" tooltipPosition="top"
                                            (click)="openEdit(user)"></button>
                                    <button pButton type="button"
                                            [icon]="user.activo ? 'pi pi-lock-open' : 'pi pi-lock'"
                                            text rounded severity="contrast"
                                            [pTooltip]="user.activo ? 'Desactivar usuario' : 'Activar usuario'"
                                            tooltipPosition="top"
                                            (click)="toggleEstado(user)"></button>
                                    <button pButton type="button" icon="pi pi-trash" text rounded severity="danger"
                                            pTooltip="Eliminar usuario" tooltipPosition="top"
                                            (click)="remove(user)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="6">
                                <div class="cies-empty-state cies-empty-state--inline">
                                    <i class="pi pi-search"></i>
                                    <p>No hay usuarios que coincidan con "<strong>{{ filtroBusqueda }}</strong>".</p>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>

        <p-toast></p-toast>
        <p-confirmDialog [style]="{ width: '32rem', 'max-width': '92vw' }" acceptButtonStyleClass="p-button-danger"
                          rejectLabel="Cancelar" acceptLabel="Confirmar"></p-confirmDialog>

        <p-dialog
            [(visible)]="showDialog"
            [modal]="true"
            [style]="{ width: '38rem', 'max-width': '96vw' }"
            [contentStyle]="{ overflow: 'visible' }"
            [draggable]="false"
            [resizable]="false"
            [header]="editingId ? 'Editar usuario' : 'Crear nuevo usuario'"
            styleClass="cies-dialog usuario-dialog"
            (onHide)="resetForm()"
        >
            <p class="usuario-dialog__lead">
                Usa <strong>Administrador</strong> para configuración y control, <strong>Encuestador</strong> para aplicar entrevistas y <strong>Analista</strong> para revisar resultados.
            </p>

            <div class="cies-form-grid cies-form-grid--two cies-dialog-form usuario-form">
                <div>
                    <label for="usuario-nombre">Nombre(s) <span class="req">*</span></label>
                    <input pInputText id="usuario-nombre" [(ngModel)]="form.nombre" class="w-full"
                           placeholder="Ej. María Elena" maxlength="80" autocomplete="given-name" />
                    <small class="field-help">Solo nombres de pila.</small>
                </div>
                <div>
                    <label for="usuario-apellido">Apellido completo <span class="req">*</span></label>
                    <input pInputText id="usuario-apellido" [(ngModel)]="form.apellido" class="w-full"
                           placeholder="Ej. López Quispe" maxlength="100" autocomplete="family-name" />
                    <small class="field-help">Apellido paterno y materno.</small>
                </div>
                <div class="cies-field--full">
                    <label for="usuario-email">Correo electrónico <span class="req">*</span></label>
                    <input pInputText id="usuario-email" [(ngModel)]="form.email" type="email" class="w-full"
                           placeholder="nombre.apellido@cies.org.bo" autocomplete="email" />
                    <small class="field-help">Será el identificador único de la cuenta.</small>
                </div>
                <div class="cies-field--full">
                    <label for="usuario-rol">Rol <span class="req">*</span></label>
                    <p-select inputId="usuario-rol" [options]="roles" [(ngModel)]="form.rol"
                              optionLabel="label" optionValue="value" appendTo="body" class="w-full"></p-select>
                </div>
                <div class="cies-field--full">
                    <label class="cies-checkbox-label">
                        <p-checkbox [(ngModel)]="form.activo" [binary]="true" inputId="usuario-activo"></p-checkbox>
                        <span>Cuenta activa <small>(podrá iniciar sesión)</small></span>
                    </label>
                </div>
                <div *ngIf="!editingId" class="cies-field--full">
                    <label for="usuario-password">Contraseña <span class="req">*</span></label>
                    <p-password inputId="usuario-password" [(ngModel)]="form.password" [feedback]="false"
                                [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"
                                placeholder="Mínimo 5 caracteres" autocomplete="new-password"></p-password>
                </div>
                <div *ngIf="editingId" class="cies-field--full">
                    <label for="usuario-password">Nueva contraseña</label>
                    <p-password inputId="usuario-password" [(ngModel)]="form.password" [feedback]="false"
                                [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"
                                placeholder="Dejar vacío para mantener la actual" autocomplete="new-password"></p-password>
                    <small class="field-help">Solo se cambia si escribes una nueva.</small>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true"
                        icon="pi pi-times" (click)="showDialog = false"></button>
                <button pButton type="button" [label]="editingId ? 'Guardar cambios' : 'Crear usuario'"
                        icon="pi pi-check" (click)="save()" [loading]="saving"></button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        .usuarios-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
            justify-content: space-between;
            margin: 0 0 1rem;
            padding: 0.5rem 0;
        }
        .usuarios-toolbar__search {
            position: relative;
            flex: 1 1 18rem;
            max-width: 30rem;
        }
        .usuarios-toolbar__search input {
            width: 100%;
            padding-left: 2.25rem;
        }
        .usuarios-toolbar__search i {
            position: absolute;
            top: 50%;
            left: 0.85rem;
            transform: translateY(-50%);
            color: var(--text-color-secondary);
        }
        .usuarios-toolbar__chips {
            display: flex;
            gap: 0.45rem;
            flex-wrap: wrap;
        }
        .usuario-cell strong {
            display: block;
            font-weight: 600;
        }
        .usuario-form .req {
            color: #dc2626;
            font-weight: 700;
            margin-left: 0.15rem;
        }
        .usuario-form .field-help {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-color-secondary);
            font-size: 0.78rem;
        }
        .usuario-dialog__lead {
            margin: 0 0 1rem;
            padding: 0.65rem 0.85rem;
            background: var(--surface-ground);
            border-radius: 0.5rem;
            font-size: 0.85rem;
            color: var(--text-color-secondary);
        }
        .cies-checkbox-label {
            display: inline-flex;
            align-items: center;
            gap: 0.55rem;
            cursor: pointer;
        }
        .cies-checkbox-label small {
            color: var(--text-color-secondary);
            margin-left: 0.25rem;
        }
        .cies-empty-state--inline {
            padding: 1.5rem 1rem;
            text-align: center;
        }
        .cies-empty-state--inline i {
            font-size: 1.4rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.5rem;
            display: block;
        }
        :host ::ng-deep .usuarios-table .p-datatable-tbody > tr > td .p-column-title {
            display: none;
            font-weight: 600;
            color: var(--text-color-secondary);
            margin-right: 0.5rem;
        }
        @media (max-width: 960px) {
            :host ::ng-deep .usuarios-table .p-datatable-tbody > tr > td .p-column-title {
                display: inline-block;
            }
            :host ::ng-deep .usuarios-table .p-datatable-tbody > tr > td {
                text-align: left !important;
            }
        }
    `]
})
export class UsuariosPage implements OnInit {
    private authService = inject(AuthService);
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);

    usuarios: UsuarioAdmin[] = [];
    totalUsuarios = 0;
    usuariosPage = 0;
    usuariosRows = 10;
    loadingUsuarios = false;
    showDialog = false;
    editingId: number | null = null;
    saving = false;
    filtroBusqueda = '';

    get usuariosFiltrados(): UsuarioAdmin[] {
        const q = this.filtroBusqueda.trim().toLowerCase();
        if (!q) return this.usuarios;
        return this.usuarios.filter((u) =>
            (`${u.nombre || ''} ${u.apellido || ''}`).toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.rol || '').toLowerCase().includes(q)
        );
    }

    formatearRol(rol: string): string {
        const map: Record<string, string> = {
            'ADMINISTRADOR': 'Administrador',
            'ENCUESTADOR': 'Encuestador',
            'ANALISTA': 'Analista',
            'EMPLEADO': 'Encuestador'
        };
        return map[(rol || '').toUpperCase()] || rol;
    }

    severidadRol(rol: string): 'danger' | 'info' | 'warn' | 'secondary' {
        switch ((rol || '').toUpperCase()) {
            case 'ADMINISTRADOR': return 'danger';
            case 'ANALISTA':      return 'warn';
            case 'ENCUESTADOR':
            case 'EMPLEADO':      return 'info';
            default:              return 'secondary';
        }
    }

    aplicarBusqueda(): void {
        // El getter usuariosFiltrados reacciona automaticamente.
        this.cdr.detectChanges();
    }

    resetForm(): void {
        if (this.showDialog) return; // si el dialog se reabre, no reseteamos
        this.editingId = null;
        this.form = { nombre: '', apellido: '', email: '', rol: 'ENCUESTADOR', activo: true, password: '' };
    }

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

        if (!nombre || !apellido || !email) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Nombre, apellido completo y correo son obligatorios.' });
            return;
        }
        if (apellido.length < 2) {
            this.messageService.add({ severity: 'warn', summary: 'Apellido', detail: 'Ingresa el apellido completo (paterno y materno).' });
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

        this.saving = true;
        const request$ = this.editingId ? this.ciesService.updateUsuario(this.editingId, payload) : this.ciesService.createUsuario(payload);
        request$.subscribe({
            next: (usuarioGuardado) => {
                this.syncCurrentUser(usuarioGuardado);
                const fueEdicion = !!this.editingId;
                this.showDialog = false;
                this.editingId = null;
                this.saving = false;
                this.cdr.detectChanges();
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: fueEdicion ? 'Usuario actualizado' : 'Usuario creado',
                    detail: `${payload.nombre} ${payload.apellido}`.trim() + ' guardado correctamente.'
                });
            },
            error: (error) => {
                this.saving = false;
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
            next: (usuarioActualizado) => {
                this.syncCurrentUser(usuarioActualizado);
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

    private syncCurrentUser(user: UsuarioAdmin): void {
        const currentUser = this.authService.getUser();
        if (!currentUser || currentUser.id !== user.id) {
            return;
        }

        this.authService.updateStoredUser({
            ...currentUser,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rol: user.rol,
            activo: user.activo
        });
    }

    remove(user: UsuarioAdmin): void {
        const isCurrentUser = this.authService.getUser()?.id === user.id;
        const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email;
        const message = isCurrentUser
            ? `Vas a eliminar tu propia cuenta (<strong>${nombreCompleto}</strong>). Se cerrará tu sesión inmediatamente.`
            : `La cuenta de <strong>${nombreCompleto}</strong> quedará oculta del sistema. ¿Deseas continuar?`;

        this.confirmationService.confirm({
            header: isCurrentUser ? 'Eliminar tu propia cuenta' : 'Eliminar usuario',
            message,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
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
                            summary: 'Usuario eliminado',
                            detail: `${nombreCompleto} fue eliminado correctamente.`
                        });
                    },
                    error: (error) => {
                        console.error('Error deleting user:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'No se pudo eliminar',
                            detail: this.extractErrorMessage(error, 'Intenta nuevamente o contacta al administrador.')
                        });
                    }
                });
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

