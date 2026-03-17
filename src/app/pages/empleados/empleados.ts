import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
    ActualizarEmpleadoRequest,
    CambiarPasswordRequest,
    CrearEmpleadoRequest,
    Empleado,
    EmpleadoService
} from '../../service/empleado.service';

interface NuevoEmpleadoForm {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol: string;
    activo: boolean;
    puedeCrearEncuestas: boolean;
}

interface EditarEmpleadoForm {
    id: number | null;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    activo: boolean;
    puedeCrearEncuestas: boolean;
}

interface CambiarPasswordForm {
    id: number | null;
    password: string;
    confirmarPassword: string;
}

interface UsuarioLogueado {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    puedeCrearEncuestas: boolean;
    activo: boolean;
}

type ErroresFormulario = Record<string, string>;

@Component({
    selector: 'app-empleados',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, DialogModule, InputTextModule, PasswordModule, CheckboxModule, SelectModule],
    template: `
        <div class="empleados-page">
            <section class="employees-hero card">
                <div class="employees-hero__content">
                    <div>
                        <div class="hero-chip">Administración</div>
                        <h1 class="hero-title">Gestión de empleados</h1>
                        <p class="hero-subtitle">Administra los usuarios que tendrán acceso al sistema, sus roles, estado y permisos de creación de encuestas.</p>
                    </div>

                    <button pButton type="button" icon="pi pi-plus" label="Nuevo empleado" class="hero-button" (click)="abrirDialogoNuevoEmpleado()"></button>
                </div>

                <div class="hero-stats">
                    <div class="hero-stat">
                        <span class="hero-stat__label">Total visibles</span>
                        <strong>{{ empleados.length }}</strong>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat__label">Activos</span>
                        <strong>{{ getCantidadActivos() }}</strong>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat__label">Administradores</span>
                        <strong>{{ getCantidadAdmins() }}</strong>
                    </div>
                </div>
            </section>

            <div *ngIf="loading" class="card mb-3">Cargando empleados...</div>

            <div *ngIf="errorMessage" class="card mb-3 text-red-500 font-medium">
                {{ errorMessage }}
            </div>

            <section class="card employees-table-card">
                <div class="table-header">
                    <div>
                        <h3>Listado de empleados</h3>
                        <p>Visualiza rápidamente el estado, el rol y los permisos de cada usuario.</p>
                    </div>
                </div>

                <p-table [value]="empleados" [tableStyle]="{ 'min-width': '72rem' }" responsiveLayout="scroll">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>ID</th>
                            <th>Empleado</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Crear encuestas</th>
                            <th style="width: 220px">Acciones</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-empleado>
                        <tr>
                            <td>{{ empleado.id }}</td>

                            <td>
                                <div class="employee-cell">
                                    <div class="employee-avatar">
                                        {{ getIniciales(empleado) }}
                                    </div>
                                    <div>
                                        <div class="employee-name">
                                            {{ empleado.nombre }} {{ empleado.apellido }}
                                            <span *ngIf="esUsuarioActual(empleado)" class="self-badge">Tú</span>
                                        </div>
                                        <small class="text-600">Usuario del sistema</small>
                                    </div>
                                </div>
                            </td>

                            <td>{{ empleado.email }}</td>

                            <td>
                                <p-tag [value]="empleado.rol" [severity]="empleado.rol === 'ADMIN' ? 'danger' : 'info'"></p-tag>
                            </td>

                            <td>
                                <p-tag [value]="empleado.activo ? 'Activo' : 'Inactivo'" [severity]="empleado.activo ? 'success' : 'secondary'"></p-tag>
                            </td>

                            <td>
                                <p-tag [value]="empleado.puedeCrearEncuestas ? 'Sí' : 'No'" [severity]="empleado.puedeCrearEncuestas ? 'info' : 'contrast'"></p-tag>
                            </td>

                            <td>
                                <div class="actions-cell">
                                    <button
                                        pButton
                                        type="button"
                                        icon="pi pi-pencil"
                                        severity="info"
                                        text
                                        rounded
                                        (click)="abrirDialogoEditarEmpleado(empleado)"
                                    ></button>

                                    <button
                                        pButton
                                        type="button"
                                        icon="pi pi-key"
                                        severity="warn"
                                        text
                                        rounded
                                        (click)="abrirDialogoCambiarPassword(empleado)"
                                    ></button>

                                    <button
                                        pButton
                                        type="button"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        text
                                        rounded
                                        [disabled]="!puedeEliminarEmpleado(empleado)"
                                        (click)="confirmarEliminarEmpleado(empleado)"
                                    ></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center py-4">No hay empleados registrados.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>

        <p-dialog
            header="Registrar empleado"
            [(visible)]="mostrarDialogoNuevoEmpleado"
            [modal]="true"
            [style]="{ width: '46rem', 'max-width': '95vw' }"
            [contentStyle]="{ overflow: 'visible' }"
            [closable]="!guardandoEmpleado"
            [draggable]="false"
            [resizable]="false"
        >
            <div class="dialog-form pt-2">
                <div class="form-section">
                    <div class="section-title">Datos personales</div>

                    <div class="dialog-grid">
                        <div class="field-block">
                            <label class="field-label">Nombre *</label>
                            <input pInputText [(ngModel)]="nuevoEmpleado.nombre" class="w-full" maxlength="100" />
                            <small class="field-help">Solo letras y espacios.</small>
                            <small *ngIf="erroresNuevoEmpleado['nombre']" class="field-error">{{ erroresNuevoEmpleado['nombre'] }}</small>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Apellido *</label>
                            <input pInputText [(ngModel)]="nuevoEmpleado.apellido" class="w-full" maxlength="100" />
                            <small class="field-help">Solo letras y espacios.</small>
                            <small *ngIf="erroresNuevoEmpleado['apellido']" class="field-error">{{ erroresNuevoEmpleado['apellido'] }}</small>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-title">Acceso al sistema</div>

                    <div class="dialog-grid">
                        <div class="field-block">
                            <label class="field-label">Correo electrónico *</label>
                            <input pInputText [(ngModel)]="nuevoEmpleado.email" class="w-full" type="email" maxlength="150" />
                            <small class="field-help">Debe ser un correo válido.</small>
                            <small *ngIf="erroresNuevoEmpleado['email']" class="field-error">{{ erroresNuevoEmpleado['email'] }}</small>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Contraseña *</label>
                            <p-password [(ngModel)]="nuevoEmpleado.password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password>
                            <small class="field-help">Mínimo 5 caracteres.</small>
                            <small *ngIf="erroresNuevoEmpleado['password']" class="field-error">{{ erroresNuevoEmpleado['password'] }}</small>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Rol *</label>
                            <p-select
                                [options]="roles"
                                [(ngModel)]="nuevoEmpleado.rol"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccione un rol"
                                class="w-full"
                            ></p-select>
                            <small *ngIf="erroresNuevoEmpleado['rol']" class="field-error">{{ erroresNuevoEmpleado['rol'] }}</small>
                        </div>

                        <div class="field-block field-block--checks">
                            <div class="check-group">
                                <div class="check-item">
                                    <p-checkbox [(ngModel)]="nuevoEmpleado.activo" binary inputId="nuevoActivo"></p-checkbox>
                                    <label for="nuevoActivo">Activo</label>
                                </div>

                                <div class="check-item">
                                    <p-checkbox [(ngModel)]="nuevoEmpleado.puedeCrearEncuestas" binary inputId="nuevoPuedeCrearEncuestas"></p-checkbox>
                                    <label for="nuevoPuedeCrearEncuestas">Puede crear encuestas</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div *ngIf="errorCrearEmpleado" class="form-error-box">
                    {{ errorCrearEmpleado }}
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="cerrarDialogoNuevoEmpleado()" [disabled]="guardandoEmpleado"></button>
                    <button pButton type="button" [label]="guardandoEmpleado ? 'Guardando...' : 'Guardar'" (click)="guardarEmpleado()" [disabled]="guardandoEmpleado"></button>
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog
            header="Editar empleado"
            [(visible)]="mostrarDialogoEditarEmpleado"
            [modal]="true"
            [style]="{ width: '46rem', 'max-width': '95vw' }"
            [contentStyle]="{ overflow: 'visible' }"
            [closable]="!actualizandoEmpleado"
            [draggable]="false"
            [resizable]="false"
        >
            <div class="dialog-form pt-2">
                <div class="form-section">
                    <div class="section-title">Datos del empleado</div>

                    <div class="dialog-grid">
                        <div class="field-block">
                            <label class="field-label">Nombre *</label>
                            <input pInputText [(ngModel)]="empleadoEditar.nombre" class="w-full" maxlength="100" />
                            <small class="field-help">Solo letras y espacios.</small>
                            <small *ngIf="erroresEditarEmpleado['nombre']" class="field-error">{{ erroresEditarEmpleado['nombre'] }}</small>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Apellido *</label>
                            <input pInputText [(ngModel)]="empleadoEditar.apellido" class="w-full" maxlength="100" />
                            <small class="field-help">Solo letras y espacios.</small>
                            <small *ngIf="erroresEditarEmpleado['apellido']" class="field-error">{{ erroresEditarEmpleado['apellido'] }}</small>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Correo electrónico *</label>
                            <input pInputText [(ngModel)]="empleadoEditar.email" class="w-full" type="email" maxlength="150" />
                            <small class="field-help">Debe ser un correo válido.</small>
                            <small *ngIf="erroresEditarEmpleado['email']" class="field-error">{{ erroresEditarEmpleado['email'] }}</small>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Rol *</label>
                            <p-select
                                [options]="roles"
                                [(ngModel)]="empleadoEditar.rol"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccione un rol"
                                class="w-full"
                            ></p-select>
                            <small *ngIf="erroresEditarEmpleado['rol']" class="field-error">{{ erroresEditarEmpleado['rol'] }}</small>
                        </div>

                        <div class="field-block field-block--checks field-block--span-2">
                            <div class="check-group check-group--row">
                                <div class="check-item">
                                    <p-checkbox [(ngModel)]="empleadoEditar.activo" binary inputId="editarActivo"></p-checkbox>
                                    <label for="editarActivo">Activo</label>
                                </div>

                                <div class="check-item">
                                    <p-checkbox [(ngModel)]="empleadoEditar.puedeCrearEncuestas" binary inputId="editarPuedeCrearEncuestas"></p-checkbox>
                                    <label for="editarPuedeCrearEncuestas">Puede crear encuestas</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div *ngIf="errorEditarEmpleado" class="form-error-box">
                    {{ errorEditarEmpleado }}
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="cerrarDialogoEditarEmpleado()" [disabled]="actualizandoEmpleado"></button>
                    <button pButton type="button" [label]="actualizandoEmpleado ? 'Guardando...' : 'Guardar cambios'" (click)="actualizarEmpleado()" [disabled]="actualizandoEmpleado"></button>
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog
            header="Cambiar contraseña"
            [(visible)]="mostrarDialogoCambiarPassword"
            [modal]="true"
            [style]="{ width: '34rem', 'max-width': '95vw' }"
            [contentStyle]="{ overflow: 'visible' }"
            [closable]="!cambiandoPassword"
            [draggable]="false"
            [resizable]="false"
        >
            <div class="dialog-form pt-2">
                <div class="form-section">
                    <div class="section-title">
                        Cambiar contraseña de
                        <strong>{{ empleadoPasswordNombre }}</strong>
                    </div>

                    <div class="dialog-grid dialog-grid--single">
                        <div class="field-block">
                            <label class="field-label">Nueva contraseña *</label>
                            <p-password [(ngModel)]="cambiarPasswordForm.password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password>
                            <small class="field-help">Mínimo 5 caracteres.</small>
                            <small *ngIf="erroresCambiarPassword['password']" class="field-error">{{ erroresCambiarPassword['password'] }}</small>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Confirmar contraseña *</label>
                            <p-password [(ngModel)]="cambiarPasswordForm.confirmarPassword" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password>
                            <small *ngIf="erroresCambiarPassword['confirmarPassword']" class="field-error">{{ erroresCambiarPassword['confirmarPassword'] }}</small>
                        </div>
                    </div>
                </div>

                <div *ngIf="errorCambiarPassword" class="form-error-box">
                    {{ errorCambiarPassword }}
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="cerrarDialogoCambiarPassword()" [disabled]="cambiandoPassword"></button>
                    <button pButton type="button" [label]="cambiandoPassword ? 'Guardando...' : 'Cambiar contraseña'" (click)="cambiarPassword()" [disabled]="cambiandoPassword"></button>
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog
            header="Confirmar eliminación"
            [(visible)]="mostrarDialogoEliminar"
            [modal]="true"
            [style]="{ width: '30rem', 'max-width': '95vw' }"
            [closable]="!eliminandoEmpleado"
            [draggable]="false"
            [resizable]="false"
        >
            <div class="pt-2">
                <p class="m-0">
                    ¿Estás seguro de eliminar a este {{ getTipoUsuarioLabel(empleadoSeleccionado) }}:
                    <strong>{{ empleadoSeleccionado?.nombre }} {{ empleadoSeleccionado?.apellido }}</strong
                    >?
                </p>

                <p class="mt-3 mb-0 text-600">Se quitará de la interfaz, pero seguirá guardado en la base de datos.</p>

                <div *ngIf="errorEliminarEmpleado" class="text-red-500 font-medium mt-3">
                    {{ errorEliminarEmpleado }}
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="cerrarDialogoEliminar()" [disabled]="eliminandoEmpleado"></button>
                    <button pButton type="button" severity="danger" [label]="eliminandoEmpleado ? 'Eliminando...' : 'Eliminar'" (click)="eliminarEmpleado()" [disabled]="eliminandoEmpleado"></button>
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [
        `
            .empleados-page {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .employees-hero {
                padding: 1.5rem;
            }

            .employees-hero__content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1.5rem;
                margin-bottom: 1.25rem;
            }

            .hero-chip {
                display: inline-flex;
                align-items: center;
                padding: 0.35rem 0.65rem;
                border-radius: 999px;
                background: var(--surface-100);
                color: var(--text-color-secondary);
                font-size: 0.85rem;
                margin-bottom: 0.85rem;
            }

            .hero-title {
                margin: 0;
                font-size: 2.3rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .hero-subtitle {
                margin: 0.85rem 0 0 0;
                max-width: 54rem;
                color: var(--text-color-secondary);
                line-height: 1.6;
            }

            .hero-button {
                min-width: 220px;
            }

            .hero-stats {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1rem;
            }

            .hero-stat {
                border: 1px solid var(--surface-border);
                border-radius: 1rem;
                background: var(--surface-50);
                padding: 1rem 1.1rem;
                display: flex;
                flex-direction: column;
                gap: 0.45rem;
            }

            .hero-stat__label {
                color: var(--text-color-secondary);
                font-size: 0.92rem;
            }

            .hero-stat strong {
                font-size: 1.6rem;
                color: var(--text-color);
            }

            .employees-table-card {
                padding-top: 1.25rem;
            }

            .table-header {
                padding: 0 0.25rem 1rem 0.25rem;
            }

            .table-header h3 {
                margin: 0;
                font-size: 1.35rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .table-header p {
                margin: 0.45rem 0 0 0;
                color: var(--text-color-secondary);
            }

            .employee-cell {
                display: flex;
                align-items: center;
                gap: 0.85rem;
            }

            .employee-avatar {
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 999px;
                background: var(--surface-100);
                color: var(--text-color);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                flex-shrink: 0;
            }

            .employee-name {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
                color: var(--text-color);
            }

            .self-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.2rem 0.5rem;
                border-radius: 999px;
                background: rgba(59, 130, 246, 0.12);
                color: #2563eb;
                font-size: 0.75rem;
                font-weight: 700;
            }

            .actions-cell {
                display: flex;
                align-items: center;
                gap: 0.35rem;
            }

            .dialog-form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .form-section {
                border: 1px solid var(--surface-border);
                border-radius: 1rem;
                padding: 1rem 1rem 1.15rem;
                background: var(--surface-0);
            }

            .section-title {
                font-size: 1rem;
                font-weight: 700;
                color: var(--text-color);
                margin-bottom: 1rem;
            }

            .dialog-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 1rem 1.25rem;
                align-items: start;
            }

            .dialog-grid--single {
                grid-template-columns: 1fr;
            }

            .field-block {
                min-width: 0;
            }

            .field-block--span-2 {
                grid-column: 1 / -1;
            }

            .field-block--checks {
                display: flex;
                align-items: center;
            }

            .field-label {
                display: block;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--text-color);
            }

            .field-help {
                display: block;
                margin-top: 0.45rem;
                color: var(--text-color-secondary);
                font-size: 0.8rem;
                line-height: 1.35;
            }

            .field-error {
                display: block;
                margin-top: 0.35rem;
                color: #dc2626;
                font-size: 0.82rem;
                font-weight: 600;
                line-height: 1.35;
            }

            .form-error-box {
                border-radius: 0.9rem;
                padding: 0.85rem 1rem;
                background: rgba(220, 38, 38, 0.08);
                color: #dc2626;
                font-weight: 600;
            }

            .check-group {
                display: flex;
                flex-direction: column;
                gap: 0.9rem;
                width: 100%;
            }

            .check-group--row {
                flex-direction: row;
                flex-wrap: wrap;
                gap: 1.25rem;
            }

            .check-item {
                display: flex;
                align-items: center;
                gap: 0.6rem;
            }

            @media (max-width: 900px) {
                .employees-hero__content {
                    flex-direction: column;
                    align-items: stretch;
                }

                .hero-button {
                    width: 100%;
                }

                .hero-stats {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 768px) {
                .dialog-grid {
                    grid-template-columns: 1fr;
                }

                .field-block--span-2 {
                    grid-column: auto;
                }

                .field-block--checks {
                    align-items: flex-start;
                }

                .check-group--row {
                    flex-direction: column;
                    gap: 0.9rem;
                }
            }
        `
    ]
})
export class Empleados implements OnInit {
    private empleadoService = inject(EmpleadoService);
    private cdr = inject(ChangeDetectorRef);

    empleados: Empleado[] = [];
    loading = false;
    errorMessage = '';

    mostrarDialogoNuevoEmpleado = false;
    guardandoEmpleado = false;
    errorCrearEmpleado = '';
    erroresNuevoEmpleado: ErroresFormulario = {};

    mostrarDialogoEditarEmpleado = false;
    actualizandoEmpleado = false;
    errorEditarEmpleado = '';
    erroresEditarEmpleado: ErroresFormulario = {};

    mostrarDialogoCambiarPassword = false;
    cambiandoPassword = false;
    errorCambiarPassword = '';
    erroresCambiarPassword: ErroresFormulario = {};
    empleadoPasswordNombre = '';

    mostrarDialogoEliminar = false;
    eliminandoEmpleado = false;
    errorEliminarEmpleado = '';
    empleadoSeleccionado: Empleado | null = null;

    usuarioLogueado: UsuarioLogueado | null = null;

    roles = [
        { label: 'ADMIN', value: 'ADMIN' },
        { label: 'EMPLEADO', value: 'EMPLEADO' }
    ];

    nuevoEmpleado: NuevoEmpleadoForm = this.obtenerFormularioInicial();
    empleadoEditar: EditarEmpleadoForm = this.obtenerFormularioEditarInicial();
    cambiarPasswordForm: CambiarPasswordForm = this.obtenerFormularioPasswordInicial();

    ngOnInit(): void {
        this.cargarUsuarioLogueado();
        this.cargarEmpleados();
    }

    cargarUsuarioLogueado(): void {
        const rawUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');

        if (!rawUser) {
            this.usuarioLogueado = null;
            return;
        }

        try {
            this.usuarioLogueado = JSON.parse(rawUser) as UsuarioLogueado;
        } catch (error) {
            console.error('No se pudo leer auth_user:', error);
            this.usuarioLogueado = null;
        }
    }

    cargarEmpleados(): void {
        this.loading = true;
        this.errorMessage = '';
        this.cdr.detectChanges();

        this.empleadoService.listarEmpleados().subscribe({
            next: (data) => {
                this.empleados = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al listar empleados:', error);
                this.errorMessage = this.obtenerMensajeError(error, 'No se pudo cargar la lista de empleados.');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    abrirDialogoNuevoEmpleado(): void {
        this.nuevoEmpleado = this.obtenerFormularioInicial();
        this.erroresNuevoEmpleado = {};
        this.errorCrearEmpleado = '';
        this.mostrarDialogoNuevoEmpleado = true;
        this.cdr.detectChanges();
    }

    cerrarDialogoNuevoEmpleado(): void {
        if (this.guardandoEmpleado) {
            return;
        }

        this.mostrarDialogoNuevoEmpleado = false;
        this.errorCrearEmpleado = '';
        this.erroresNuevoEmpleado = {};
        this.cdr.detectChanges();
    }

    guardarEmpleado(): void {
        this.errorCrearEmpleado = '';
        this.erroresNuevoEmpleado = {};

        if (!this.validarNuevoEmpleado()) {
            this.cdr.detectChanges();
            return;
        }

        const payload: CrearEmpleadoRequest = {
            nombre: this.normalizarTexto(this.nuevoEmpleado.nombre),
            apellido: this.normalizarTexto(this.nuevoEmpleado.apellido),
            email: this.normalizarEmail(this.nuevoEmpleado.email),
            password: this.nuevoEmpleado.password.trim(),
            rol: this.nuevoEmpleado.rol,
            activo: this.nuevoEmpleado.activo,
            puedeCrearEncuestas: this.nuevoEmpleado.puedeCrearEncuestas
        };

        this.guardandoEmpleado = true;
        this.cdr.detectChanges();

        this.empleadoService.crearEmpleado(payload).subscribe({
            next: () => {
                this.guardandoEmpleado = false;
                this.mostrarDialogoNuevoEmpleado = false;
                this.nuevoEmpleado = this.obtenerFormularioInicial();
                this.erroresNuevoEmpleado = {};
                this.cdr.detectChanges();
                this.cargarEmpleados();
            },
            error: (error) => {
                console.error('Error al crear empleado:', error);
                this.errorCrearEmpleado = this.obtenerMensajeError(error, 'No se pudo crear el empleado.');
                this.guardandoEmpleado = false;
                this.cdr.detectChanges();
            }
        });
    }

    abrirDialogoEditarEmpleado(empleado: Empleado): void {
        this.empleadoEditar = {
            id: empleado.id,
            nombre: empleado.nombre ?? '',
            apellido: empleado.apellido ?? '',
            email: empleado.email ?? '',
            rol: empleado.rol ?? 'EMPLEADO',
            activo: !!empleado.activo,
            puedeCrearEncuestas: !!empleado.puedeCrearEncuestas
        };

        this.erroresEditarEmpleado = {};
        this.errorEditarEmpleado = '';
        this.mostrarDialogoEditarEmpleado = true;
        this.cdr.detectChanges();
    }

    cerrarDialogoEditarEmpleado(): void {
        if (this.actualizandoEmpleado) {
            return;
        }

        this.mostrarDialogoEditarEmpleado = false;
        this.errorEditarEmpleado = '';
        this.erroresEditarEmpleado = {};
        this.empleadoEditar = this.obtenerFormularioEditarInicial();
        this.cdr.detectChanges();
    }

    actualizarEmpleado(): void {
        this.errorEditarEmpleado = '';
        this.erroresEditarEmpleado = {};

        if (!this.validarEditarEmpleado()) {
            this.cdr.detectChanges();
            return;
        }

        if (!this.empleadoEditar.id) {
            this.errorEditarEmpleado = 'No se pudo identificar el empleado a editar.';
            this.cdr.detectChanges();
            return;
        }

        const payload: ActualizarEmpleadoRequest = {
            nombre: this.normalizarTexto(this.empleadoEditar.nombre),
            apellido: this.normalizarTexto(this.empleadoEditar.apellido),
            email: this.normalizarEmail(this.empleadoEditar.email),
            rol: this.empleadoEditar.rol,
            activo: this.empleadoEditar.activo,
            puedeCrearEncuestas: this.empleadoEditar.puedeCrearEncuestas
        };

        this.actualizandoEmpleado = true;
        this.cdr.detectChanges();

        this.empleadoService.actualizarEmpleado(this.empleadoEditar.id, payload).subscribe({
            next: (empleadoActualizado) => {
                this.actualizandoEmpleado = false;
                this.mostrarDialogoEditarEmpleado = false;
                this.errorEditarEmpleado = '';
                this.erroresEditarEmpleado = {};

                if (this.esUsuarioActualPorId(empleadoActualizado.id)) {
                    this.actualizarSesionUsuario(empleadoActualizado);
                }

                this.empleadoEditar = this.obtenerFormularioEditarInicial();
                this.cdr.detectChanges();
                this.cargarEmpleados();
            },
            error: (error) => {
                console.error('Error al actualizar empleado:', error);
                this.errorEditarEmpleado = this.obtenerMensajeError(error, 'No se pudo actualizar el empleado.');
                this.actualizandoEmpleado = false;
                this.cdr.detectChanges();
            }
        });
    }

    abrirDialogoCambiarPassword(empleado: Empleado): void {
        this.cambiarPasswordForm = {
            id: empleado.id,
            password: '',
            confirmarPassword: ''
        };

        this.empleadoPasswordNombre = `${empleado.nombre} ${empleado.apellido}`.trim();
        this.erroresCambiarPassword = {};
        this.errorCambiarPassword = '';
        this.mostrarDialogoCambiarPassword = true;
        this.cdr.detectChanges();
    }

    cerrarDialogoCambiarPassword(): void {
        if (this.cambiandoPassword) {
            return;
        }

        this.mostrarDialogoCambiarPassword = false;
        this.errorCambiarPassword = '';
        this.erroresCambiarPassword = {};
        this.empleadoPasswordNombre = '';
        this.cambiarPasswordForm = this.obtenerFormularioPasswordInicial();
        this.cdr.detectChanges();
    }

    cambiarPassword(): void {
        this.errorCambiarPassword = '';
        this.erroresCambiarPassword = {};

        if (!this.validarCambiarPassword()) {
            this.cdr.detectChanges();
            return;
        }

        if (!this.cambiarPasswordForm.id) {
            this.errorCambiarPassword = 'No se pudo identificar el empleado.';
            this.cdr.detectChanges();
            return;
        }

        const payload: CambiarPasswordRequest = {
            password: this.cambiarPasswordForm.password.trim()
        };

        this.cambiandoPassword = true;
        this.cdr.detectChanges();

        this.empleadoService.cambiarPassword(this.cambiarPasswordForm.id, payload).subscribe({
            next: () => {
                this.cambiandoPassword = false;
                this.mostrarDialogoCambiarPassword = false;
                this.errorCambiarPassword = '';
                this.erroresCambiarPassword = {};
                this.empleadoPasswordNombre = '';
                this.cambiarPasswordForm = this.obtenerFormularioPasswordInicial();
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cambiar contraseña:', error);
                this.errorCambiarPassword = this.obtenerMensajeError(error, 'No se pudo cambiar la contraseña.');
                this.cambiandoPassword = false;
                this.cdr.detectChanges();
            }
        });
    }

    confirmarEliminarEmpleado(empleado: Empleado): void {
        if (!this.puedeEliminarEmpleado(empleado)) {
            this.errorMessage = this.esUsuarioActual(empleado)
                ? 'No puedes eliminar el usuario con el que tienes la sesión iniciada.'
                : 'No se puede eliminar el administrador principal.';
            this.cdr.detectChanges();
            return;
        }

        this.empleadoSeleccionado = empleado;
        this.errorEliminarEmpleado = '';
        this.mostrarDialogoEliminar = true;
        this.cdr.detectChanges();
    }

    cerrarDialogoEliminar(): void {
        if (this.eliminandoEmpleado) {
            return;
        }

        this.mostrarDialogoEliminar = false;
        this.errorEliminarEmpleado = '';
        this.empleadoSeleccionado = null;
        this.cdr.detectChanges();
    }

    eliminarEmpleado(): void {
        if (!this.empleadoSeleccionado) {
            return;
        }

        const currentUserEmail = this.usuarioLogueado?.email ?? '';

        this.eliminandoEmpleado = true;
        this.errorEliminarEmpleado = '';
        this.cdr.detectChanges();

        this.empleadoService.eliminarEmpleado(this.empleadoSeleccionado.id, currentUserEmail).subscribe({
            next: () => {
                this.eliminandoEmpleado = false;
                this.mostrarDialogoEliminar = false;
                this.empleadoSeleccionado = null;
                this.cdr.detectChanges();
                this.cargarEmpleados();
            },
            error: (error) => {
                console.error('Error al eliminar empleado:', error);
                this.errorEliminarEmpleado = this.obtenerMensajeError(error, 'No se pudo eliminar el empleado.');
                this.eliminandoEmpleado = false;
                this.cdr.detectChanges();
            }
        });
    }

    puedeEliminarEmpleado(empleado: Empleado): boolean {
        if (!empleado) {
            return false;
        }

        if (this.esUsuarioActual(empleado)) {
            return false;
        }

        return !this.esAdminPrincipal(empleado);
    }

    esUsuarioActual(empleado: Empleado): boolean {
        if (!this.usuarioLogueado?.email || !empleado.email) {
            return false;
        }

        return this.usuarioLogueado.email.toLowerCase() === empleado.email.toLowerCase();
    }

    esUsuarioActualPorId(id: number): boolean {
        if (!this.usuarioLogueado?.id) {
            return false;
        }

        return this.usuarioLogueado.id === id;
    }

    esAdminPrincipal(empleado: Empleado): boolean {
        return (empleado.email ?? '').toLowerCase() === 'admin@encuestas.com';
    }

    getTipoUsuarioLabel(empleado: Empleado | null): string {
        if (!empleado) {
            return 'usuario';
        }

        return empleado.rol === 'ADMIN' ? 'administrador' : 'empleado';
    }

    getIniciales(empleado: Empleado): string {
        const nombre = empleado.nombre?.charAt(0) || '';
        const apellido = empleado.apellido?.charAt(0) || '';
        return `${nombre}${apellido}`.toUpperCase();
    }

    getCantidadActivos(): number {
        return this.empleados.filter((empleado) => empleado.activo).length;
    }

    getCantidadAdmins(): number {
        return this.empleados.filter((empleado) => empleado.rol === 'ADMIN').length;
    }

    private validarNuevoEmpleado(): boolean {
        const errores: ErroresFormulario = {};

        if (!this.esTextoNombreValido(this.nuevoEmpleado.nombre)) {
            errores['nombre'] = 'Ingresa un nombre válido.';
        }

        if (!this.esTextoNombreValido(this.nuevoEmpleado.apellido)) {
            errores['apellido'] = 'Ingresa un apellido válido.';
        }

        if (!this.esCorreoValido(this.nuevoEmpleado.email)) {
            errores['email'] = 'Ingresa un correo válido.';
        }

        if (!this.esPasswordValido(this.nuevoEmpleado.password)) {
            errores['password'] = 'La contraseña debe tener al menos 5 caracteres.';
        }

        if (!this.nuevoEmpleado.rol?.trim()) {
            errores['rol'] = 'Selecciona un rol.';
        }

        this.erroresNuevoEmpleado = errores;

        if (Object.keys(errores).length > 0) {
            this.errorCrearEmpleado = 'Corrige los campos marcados antes de guardar.';
            return false;
        }

        return true;
    }

    private validarEditarEmpleado(): boolean {
        const errores: ErroresFormulario = {};

        if (!this.esTextoNombreValido(this.empleadoEditar.nombre)) {
            errores['nombre'] = 'Ingresa un nombre válido.';
        }

        if (!this.esTextoNombreValido(this.empleadoEditar.apellido)) {
            errores['apellido'] = 'Ingresa un apellido válido.';
        }

        if (!this.esCorreoValido(this.empleadoEditar.email)) {
            errores['email'] = 'Ingresa un correo válido.';
        }

        if (!this.empleadoEditar.rol?.trim()) {
            errores['rol'] = 'Selecciona un rol.';
        }

        this.erroresEditarEmpleado = errores;

        if (Object.keys(errores).length > 0) {
            this.errorEditarEmpleado = 'Corrige los campos marcados antes de guardar.';
            return false;
        }

        return true;
    }

    private validarCambiarPassword(): boolean {
        const errores: ErroresFormulario = {};

        if (!this.esPasswordValido(this.cambiarPasswordForm.password)) {
            errores['password'] = 'La contraseña debe tener al menos 5 caracteres.';
        }

        if (!this.cambiarPasswordForm.confirmarPassword.trim()) {
            errores['confirmarPassword'] = 'Debes confirmar la contraseña.';
        } else if (this.cambiarPasswordForm.password.trim() !== this.cambiarPasswordForm.confirmarPassword.trim()) {
            errores['confirmarPassword'] = 'Las contraseñas no coinciden.';
        }

        this.erroresCambiarPassword = errores;

        if (Object.keys(errores).length > 0) {
            this.errorCambiarPassword = 'Corrige los campos marcados antes de continuar.';
            return false;
        }

        return true;
    }

    private esTextoNombreValido(valor: string): boolean {
        const texto = this.normalizarTexto(valor);
        const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
        return texto.length > 0 && regex.test(texto);
    }

    private esCorreoValido(valor: string): boolean {
        const correo = this.normalizarEmail(valor);
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(correo);
    }

    private esPasswordValido(valor: string): boolean {
        return valor.trim().length >= 5;
    }

    private normalizarTexto(valor: string): string {
        return (valor || '').trim().replace(/\s+/g, ' ');
    }

    private normalizarEmail(valor: string): string {
        return (valor || '').trim().toLowerCase();
    }

    private obtenerMensajeError(error: any, fallback: string): string {
        if (typeof error?.error === 'string' && error.error.trim()) {
            return error.error;
        }

        if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
            return error.error.message;
        }

        return fallback;
    }

    private actualizarSesionUsuario(empleado: Empleado): void {
        const usuarioActualizado: UsuarioLogueado = {
            id: empleado.id,
            nombre: empleado.nombre,
            apellido: empleado.apellido,
            email: empleado.email,
            rol: empleado.rol,
            puedeCrearEncuestas: empleado.puedeCrearEncuestas,
            activo: empleado.activo
        };

        this.usuarioLogueado = usuarioActualizado;

        if (localStorage.getItem('auth_user')) {
            localStorage.setItem('auth_user', JSON.stringify(usuarioActualizado));
        } else if (sessionStorage.getItem('auth_user')) {
            sessionStorage.setItem('auth_user', JSON.stringify(usuarioActualizado));
        }
    }

    private obtenerFormularioInicial(): NuevoEmpleadoForm {
        return {
            nombre: '',
            apellido: '',
            email: '',
            password: '',
            rol: 'EMPLEADO',
            activo: true,
            puedeCrearEncuestas: false
        };
    }

    private obtenerFormularioEditarInicial(): EditarEmpleadoForm {
        return {
            id: null,
            nombre: '',
            apellido: '',
            email: '',
            rol: 'EMPLEADO',
            activo: true,
            puedeCrearEncuestas: false
        };
    }

    private obtenerFormularioPasswordInicial(): CambiarPasswordForm {
        return {
            id: null,
            password: '',
            confirmarPassword: ''
        };
    }
}