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
import { Empleado, EmpleadoService } from '../../service/empleado.service';

interface NuevoEmpleadoForm {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol: string;
    activo: boolean;
    puedeCrearEncuestas: boolean;
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
                        <p class="hero-subtitle">Administra los usuarios que tendrán acceso al sistema, sus roles y permisos de creación de encuestas.</p>
                    </div>

                    <button pButton type="button" icon="pi pi-plus" label="Nuevo empleado" class="hero-button" (click)="abrirDialogoNuevoEmpleado()"></button>
                </div>

                <div class="hero-stats">
                    <div class="hero-stat">
                        <span class="hero-stat__label">Total empleados</span>
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
                                    <button pButton type="button" icon="pi pi-pencil" severity="info" text rounded></button>
                                    <button pButton type="button" icon="pi pi-key" severity="warn" text rounded></button>
                                    <button pButton type="button" icon="pi pi-trash" severity="danger" text rounded [disabled]="esUsuarioActual(empleado)" (click)="confirmarEliminarEmpleado(empleado)"></button>
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
            header="Nuevo empleado"
            [(visible)]="mostrarDialogoNuevoEmpleado"
            [modal]="true"
            [style]="{ width: '42rem', 'max-width': '95vw' }"
            [contentStyle]="{ overflow: 'visible' }"
            [closable]="!guardandoEmpleado"
            [draggable]="false"
            [resizable]="false"
        >
            <div class="flex flex-column gap-4 pt-2">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Nombre</label>
                        <input pInputText [(ngModel)]="nuevoEmpleado.nombre" class="w-full" />
                    </div>

                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Apellido</label>
                        <input pInputText [(ngModel)]="nuevoEmpleado.apellido" class="w-full" />
                    </div>

                    <div class="col-12">
                        <label class="block mb-2 font-medium">Correo</label>
                        <input pInputText [(ngModel)]="nuevoEmpleado.email" class="w-full" />
                    </div>

                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Contraseña</label>
                        <p-password [(ngModel)]="nuevoEmpleado.password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password>
                    </div>

                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Rol</label>
                        <p-select [options]="roles" [(ngModel)]="nuevoEmpleado.rol" optionLabel="label" optionValue="value" placeholder="Seleccione un rol" class="w-full"></p-select>
                    </div>

                    <div class="col-12 md:col-6">
                        <div class="flex align-items-center gap-2 mt-2">
                            <p-checkbox [(ngModel)]="nuevoEmpleado.activo" binary inputId="activo"></p-checkbox>
                            <label for="activo">Activo</label>
                        </div>
                    </div>

                    <div class="col-12 md:col-6">
                        <div class="flex align-items-center gap-2 mt-2">
                            <p-checkbox [(ngModel)]="nuevoEmpleado.puedeCrearEncuestas" binary inputId="puedeCrearEncuestas"></p-checkbox>
                            <label for="puedeCrearEncuestas">Puede crear encuestas</label>
                        </div>
                    </div>
                </div>

                <div *ngIf="errorCrearEmpleado" class="text-red-500 font-medium">
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

        <p-dialog header="Confirmar eliminación" [(visible)]="mostrarDialogoEliminar" [modal]="true" [style]="{ width: '28rem', 'max-width': '95vw' }" [closable]="!eliminandoEmpleado" [draggable]="false" [resizable]="false">
            <div class="pt-2">
                <p class="m-0">
                    ¿Estás seguro de eliminar a
                    <strong>{{ empleadoSeleccionado?.nombre }} {{ empleadoSeleccionado?.apellido }}</strong
                    >?
                </p>

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

    ngOnInit(): void {
        this.cargarUsuarioLogueado();
        this.cargarEmpleados();
    }

    cargarUsuarioLogueado(): void {
        const rawUser = localStorage.getItem('auth_user');

        if (!rawUser) {
            this.usuarioLogueado = null;
            return;
        }

        try {
            this.usuarioLogueado = JSON.parse(rawUser) as UsuarioLogueado;
        } catch (error) {
            console.error('No se pudo leer auth_user desde localStorage:', error);
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
                this.errorMessage = 'No se pudo cargar la lista de empleados.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    abrirDialogoNuevoEmpleado(): void {
        this.nuevoEmpleado = this.obtenerFormularioInicial();
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
        this.cdr.detectChanges();
    }

    guardarEmpleado(): void {
        this.errorCrearEmpleado = '';

        if (!this.nuevoEmpleado.nombre.trim() || !this.nuevoEmpleado.apellido.trim() || !this.nuevoEmpleado.email.trim() || !this.nuevoEmpleado.password.trim() || !this.nuevoEmpleado.rol.trim()) {
            this.errorCrearEmpleado = 'Completa todos los campos obligatorios.';
            this.cdr.detectChanges();
            return;
        }

        this.guardandoEmpleado = true;
        this.cdr.detectChanges();

        this.empleadoService
            .crearEmpleado({
                nombre: this.nuevoEmpleado.nombre.trim(),
                apellido: this.nuevoEmpleado.apellido.trim(),
                email: this.nuevoEmpleado.email.trim(),
                password: this.nuevoEmpleado.password.trim(),
                rol: this.nuevoEmpleado.rol,
                activo: this.nuevoEmpleado.activo,
                puedeCrearEncuestas: this.nuevoEmpleado.puedeCrearEncuestas
            })
            .subscribe({
                next: () => {
                    this.guardandoEmpleado = false;
                    this.mostrarDialogoNuevoEmpleado = false;
                    this.nuevoEmpleado = this.obtenerFormularioInicial();
                    this.cdr.detectChanges();
                    this.cargarEmpleados();
                },
                error: (error) => {
                    console.error('Error al crear empleado:', error);
                    this.errorCrearEmpleado = typeof error?.error === 'string' ? error.error : 'No se pudo crear el empleado.';
                    this.guardandoEmpleado = false;
                    this.cdr.detectChanges();
                }
            });
    }

    confirmarEliminarEmpleado(empleado: Empleado): void {
        if (this.esUsuarioActual(empleado)) {
            this.errorMessage = 'No puedes eliminar el usuario con el que tienes la sesión iniciada.';
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

        if (!this.usuarioLogueado?.email) {
            this.errorEliminarEmpleado = 'No se pudo identificar el usuario actual.';
            this.cdr.detectChanges();
            return;
        }

        this.eliminandoEmpleado = true;
        this.errorEliminarEmpleado = '';
        this.cdr.detectChanges();

        this.empleadoService.eliminarEmpleado(this.empleadoSeleccionado.id, this.usuarioLogueado.email).subscribe({
            next: () => {
                this.eliminandoEmpleado = false;
                this.mostrarDialogoEliminar = false;
                this.empleadoSeleccionado = null;
                this.cdr.detectChanges();
                this.cargarEmpleados();
            },
            error: (error) => {
                console.error('Error al eliminar empleado:', error);
                this.errorEliminarEmpleado = typeof error?.error === 'string' ? error.error : 'No se pudo eliminar el empleado.';
                this.eliminandoEmpleado = false;
                this.cdr.detectChanges();
            }
        });
    }

    esUsuarioActual(empleado: Empleado): boolean {
        if (!this.usuarioLogueado?.email || !empleado.email) {
            return false;
        }

        return this.usuarioLogueado.email.toLowerCase() === empleado.email.toLowerCase();
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
}
