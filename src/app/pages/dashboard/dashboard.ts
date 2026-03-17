import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DashboardAdminResponse, DashboardEmpleadoResponse, EncuestaService } from '../../service/encuesta.service';

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
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TableModule, TagModule],
    template: `
        <div class="dashboard-page">
            <ng-container *ngIf="rolUsuario === 'ADMIN'; else empleadoBlock">
                <section class="dashboard-hero card">
                    <div class="dashboard-hero__content">
                        <div>
                            <h1 class="dashboard-title">Dashboard administrativo</h1>
                            <p class="dashboard-subtitle">Revisa el estado general del sistema, las encuestas recientes y las últimas respuestas recibidas.</p>
                        </div>

                        <div class="dashboard-actions">
                            <a routerLink="/pages/encuestas/crear">
                                <button pButton type="button" label="Crear encuesta" icon="pi pi-plus"></button>
                            </a>
                            <a routerLink="/pages/encuestas/resultados">
                                <button pButton type="button" label="Ver resultados" icon="pi pi-chart-bar" severity="secondary"></button>
                            </a>
                        </div>
                    </div>
                </section>

                <div *ngIf="loading" class="card">Cargando dashboard...</div>

                <div *ngIf="errorMessage" class="card text-red-500 font-medium">
                    {{ errorMessage }}
                </div>

                <ng-container *ngIf="!loading && dashboardAdmin">
                    <section class="stats-grid">
                        <article class="stat-card card">
                            <div class="stat-card__label">Total encuestas</div>
                            <div class="stat-card__value">{{ dashboardAdmin.totalEncuestas }}</div>
                        </article>

                        <article class="stat-card card">
                            <div class="stat-card__label">Abiertas</div>
                            <div class="stat-card__value">{{ dashboardAdmin.encuestasAbiertas }}</div>
                        </article>

                        <article class="stat-card card">
                            <div class="stat-card__label">Borrador</div>
                            <div class="stat-card__value">{{ dashboardAdmin.encuestasBorrador }}</div>
                        </article>

                        <article class="stat-card card">
                            <div class="stat-card__label">Cerradas</div>
                            <div class="stat-card__value">{{ dashboardAdmin.encuestasCerradas }}</div>
                        </article>

                        <article class="stat-card card">
                            <div class="stat-card__label">Total respuestas</div>
                            <div class="stat-card__value">{{ dashboardAdmin.totalRespuestas }}</div>
                        </article>

                        <article class="stat-card card">
                            <div class="stat-card__label">Empleados</div>
                            <div class="stat-card__value">{{ dashboardAdmin.totalEmpleados }}</div>
                        </article>
                    </section>

                    <section class="dashboard-grid">
                        <article class="card panel-card">
                            <div class="panel-card__header">
                                <h3>Estado de encuestas</h3>
                                <p>Distribución rápida del estado actual.</p>
                            </div>

                            <div class="bars-list">
                                <div class="bar-row">
                                    <div class="bar-row__header">
                                        <span>Borrador</span>
                                        <strong>{{ dashboardAdmin.encuestasBorrador }}</strong>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill bar-fill--draft" [style.width.%]="getPercent(dashboardAdmin.encuestasBorrador)"></div>
                                    </div>
                                </div>

                                <div class="bar-row">
                                    <div class="bar-row__header">
                                        <span>Abiertas</span>
                                        <strong>{{ dashboardAdmin.encuestasAbiertas }}</strong>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill bar-fill--open" [style.width.%]="getPercent(dashboardAdmin.encuestasAbiertas)"></div>
                                    </div>
                                </div>

                                <div class="bar-row">
                                    <div class="bar-row__header">
                                        <span>Cerradas</span>
                                        <strong>{{ dashboardAdmin.encuestasCerradas }}</strong>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill bar-fill--closed" [style.width.%]="getPercent(dashboardAdmin.encuestasCerradas)"></div>
                                    </div>
                                </div>
                            </div>
                        </article>

                        <article class="card panel-card">
                            <div class="panel-card__header">
                                <h3>Resumen operativo</h3>
                                <p>Vista rápida para tomar decisiones.</p>
                            </div>

                            <div class="summary-grid">
                                <div class="summary-box">
                                    <span>Encuestas activas</span>
                                    <strong>{{ dashboardAdmin.encuestasAbiertas }}</strong>
                                </div>
                                <div class="summary-box">
                                    <span>Respuestas recientes</span>
                                    <strong>{{ dashboardAdmin.respuestasRecientes.length }}</strong>
                                </div>
                                <div class="summary-box">
                                    <span>Encuestas recientes</span>
                                    <strong>{{ dashboardAdmin.encuestasRecientes.length }}</strong>
                                </div>
                                <div class="summary-box">
                                    <span>Promedio respuestas/encuesta</span>
                                    <strong>{{ getPromedioRespuestasAdmin() }}</strong>
                                </div>
                            </div>
                        </article>
                    </section>

                    <section class="dashboard-grid">
                        <article class="card table-card">
                            <div class="panel-card__header">
                                <h3>Últimas encuestas</h3>
                                <p>Encuestas creadas más recientemente.</p>
                            </div>

                            <p-table [value]="dashboardAdmin.encuestasRecientes" [tableStyle]="{ 'min-width': '40rem' }" responsiveLayout="scroll">
                                <ng-template pTemplate="header">
                                    <tr>
                                        <th>ID</th>
                                        <th>Título</th>
                                        <th>Estado</th>
                                        <th>Tipo</th>
                                        <th>Fecha</th>
                                    </tr>
                                </ng-template>

                                <ng-template pTemplate="body" let-item>
                                    <tr>
                                        <td>{{ item.id }}</td>
                                        <td>{{ item.titulo }}</td>
                                        <td>
                                            <p-tag [value]="getEstadoTexto(item.estado)" [severity]="getEstadoSeverity(item.estado)"></p-tag>
                                        </td>
                                        <td>
                                            <p-tag [value]="item.modoCalificable ? 'Cuestionario' : 'Encuesta'" [severity]="item.modoCalificable ? 'warn' : 'info'"></p-tag>
                                        </td>
                                        <td>{{ formatearFecha(item.fechaCreacion) }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </article>

                        <article class="card table-card">
                            <div class="panel-card__header">
                                <h3>Últimas respuestas</h3>
                                <p>Actividad reciente de los empleados.</p>
                            </div>

                            <p-table [value]="dashboardAdmin.respuestasRecientes" [tableStyle]="{ 'min-width': '40rem' }" responsiveLayout="scroll">
                                <ng-template pTemplate="header">
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Encuesta</th>
                                        <th>Fecha</th>
                                    </tr>
                                </ng-template>

                                <ng-template pTemplate="body" let-item>
                                    <tr>
                                        <td>
                                            <div class="font-medium">{{ item.participante }}</div>
                                            <small class="text-600">{{ item.correo || 'Sin correo' }}</small>
                                        </td>
                                        <td>{{ item.encuestaTitulo }}</td>
                                        <td>{{ formatearFecha(item.fechaRespuesta) }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </article>
                    </section>
                </ng-container>
            </ng-container>

            <ng-template #empleadoBlock>
                <section class="dashboard-hero card">
                    <div class="dashboard-hero__content">
                        <div>
                            <h1 class="dashboard-title">Bienvenido, {{ nombreCompletoUsuario || 'Empleado' }}</h1>
                            <p class="dashboard-subtitle">Aquí verás primero tus encuestas pendientes y luego tu actividad reciente.</p>
                        </div>

                        <div class="dashboard-actions">
                            <a routerLink="/pages/encuestas/responder">
                                <button pButton type="button" label="Ir a encuestas" icon="pi pi-send"></button>
                            </a>
                        </div>
                    </div>
                </section>

                <div *ngIf="loading" class="card">Cargando dashboard...</div>

                <div *ngIf="errorMessage" class="card text-red-500 font-medium">
                    {{ errorMessage }}
                </div>

                <ng-container *ngIf="!loading && dashboardEmpleado">
                    <section class="card pending-hero-card">
                        <div class="pending-hero-card__content">
                            <div>
                                <div class="pending-hero-card__eyebrow">Prioridad</div>
                                <h2 class="pending-hero-card__title">Encuestas pendientes por responder</h2>
                                <p class="pending-hero-card__subtitle">Estas son las encuestas activas que todavía no has completado.</p>
                            </div>

                            <div class="pending-hero-card__badge">
                                <span>{{ dashboardEmpleado.encuestasPendientes }}</span>
                                <small>Pendientes</small>
                            </div>
                        </div>
                    </section>

                    <section class="stats-grid employee-stats-grid">
                        <article class="stat-card card stat-card--highlight">
                            <div class="stat-card__label">Pendientes</div>
                            <div class="stat-card__value">{{ dashboardEmpleado.encuestasPendientes }}</div>
                        </article>

                        <article class="stat-card card">
                            <div class="stat-card__label">Abiertas</div>
                            <div class="stat-card__value">{{ dashboardEmpleado.encuestasAbiertas }}</div>
                        </article>

                        <article class="stat-card card">
                            <div class="stat-card__label">Respondidas</div>
                            <div class="stat-card__value">{{ dashboardEmpleado.encuestasRespondidas }}</div>
                        </article>

                        <article class="stat-card card">
                            <div class="stat-card__label">Cerradas</div>
                            <div class="stat-card__value">{{ dashboardEmpleado.encuestasCerradas }}</div>
                        </article>
                    </section>

                    <section class="card table-card">
                        <div class="panel-card__header panel-card__header--with-action">
                            <div>
                                <h3>Encuestas pendientes</h3>
                                <p>Completa estas encuestas cuando puedas.</p>
                            </div>

                            <a routerLink="/pages/encuestas/responder">
                                <button pButton type="button" label="Ver todas" icon="pi pi-arrow-right" severity="secondary"></button>
                            </a>
                        </div>

                        <p-table [value]="dashboardEmpleado.encuestasPendientesRecientes" [tableStyle]="{ 'min-width': '40rem' }" responsiveLayout="scroll">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Descripción</th>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th style="width: 150px">Acción</th>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td>{{ item.id }}</td>
                                    <td>{{ item.titulo }}</td>
                                    <td>{{ item.descripcion || 'Sin descripción' }}</td>
                                    <td>
                                        <p-tag [value]="item.modoCalificable ? 'Cuestionario' : 'Encuesta'" [severity]="item.modoCalificable ? 'warn' : 'info'"></p-tag>
                                    </td>
                                    <td>{{ formatearFecha(item.fechaCreacion) }}</td>
                                    <td>
                                        <a [routerLink]="['/pages/encuestas/responder', item.id]">
                                            <button pButton type="button" label="Responder" icon="pi pi-file-edit"></button>
                                        </a>
                                    </td>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="6" class="text-center py-4">No tienes encuestas pendientes en este momento.</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </section>

                    <section class="dashboard-grid">
                        <article class="card panel-card">
                            <div class="panel-card__header">
                                <h3>Resumen personal</h3>
                                <p>Información rápida sobre tu actividad.</p>
                            </div>

                            <div class="summary-grid">
                                <div class="summary-box">
                                    <span>Nombre</span>
                                    <strong>{{ dashboardEmpleado.nombreEmpleado }}</strong>
                                </div>
                                <div class="summary-box">
                                    <span>Correo</span>
                                    <strong>{{ dashboardEmpleado.correoEmpleado }}</strong>
                                </div>
                                <div class="summary-box">
                                    <span>Encuestas pendientes</span>
                                    <strong>{{ dashboardEmpleado.encuestasPendientes }}</strong>
                                </div>
                                <div class="summary-box">
                                    <span>Últimas respuestas</span>
                                    <strong>{{ dashboardEmpleado.respuestasRecientes.length }}</strong>
                                </div>
                            </div>
                        </article>

                        <article class="card panel-card">
                            <div class="panel-card__header">
                                <h3>Tu estado</h3>
                                <p>Distribución simple de tu actividad actual.</p>
                            </div>

                            <div class="bars-list">
                                <div class="bar-row">
                                    <div class="bar-row__header">
                                        <span>Pendientes</span>
                                        <strong>{{ dashboardEmpleado.encuestasPendientes }}</strong>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill bar-fill--pending" [style.width.%]="getPercentEmpleado(dashboardEmpleado.encuestasPendientes)"></div>
                                    </div>
                                </div>

                                <div class="bar-row">
                                    <div class="bar-row__header">
                                        <span>Respondidas</span>
                                        <strong>{{ dashboardEmpleado.encuestasRespondidas }}</strong>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill bar-fill--info" [style.width.%]="getPercentEmpleado(dashboardEmpleado.encuestasRespondidas)"></div>
                                    </div>
                                </div>

                                <div class="bar-row">
                                    <div class="bar-row__header">
                                        <span>Cerradas</span>
                                        <strong>{{ dashboardEmpleado.encuestasCerradas }}</strong>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill bar-fill--closed" [style.width.%]="getPercentEmpleado(dashboardEmpleado.encuestasCerradas)"></div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </section>

                    <section class="card table-card">
                        <div class="panel-card__header">
                            <h3>Tus últimas respuestas</h3>
                            <p>Actividad reciente registrada con tu usuario.</p>
                        </div>

                        <p-table [value]="dashboardEmpleado.respuestasRecientes" [tableStyle]="{ 'min-width': '40rem' }" responsiveLayout="scroll">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Encuesta</th>
                                    <th>Fecha</th>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td>{{ item.encuestaTitulo }}</td>
                                    <td>{{ formatearFecha(item.fechaRespuesta) }}</td>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="2" class="text-center py-4">Aún no tienes respuestas registradas.</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </section>
                </ng-container>
            </ng-template>
        </div>
    `,
    styles: [
        `
            .dashboard-page {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .dashboard-hero__content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1.5rem;
            }

            .dashboard-title {
                margin: 0;
                font-size: 2.4rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .dashboard-subtitle {
                margin: 0.85rem 0 0 0;
                color: var(--text-color-secondary);
                max-width: 54rem;
                line-height: 1.6;
            }

            .dashboard-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
            }

            .pending-hero-card {
                border: 1px solid var(--surface-border);
            }

            .pending-hero-card__content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1.5rem;
            }

            .pending-hero-card__eyebrow {
                font-size: 0.9rem;
                font-weight: 700;
                color: var(--primary-color);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 0.6rem;
            }

            .pending-hero-card__title {
                margin: 0;
                font-size: 2rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .pending-hero-card__subtitle {
                margin: 0.75rem 0 0 0;
                color: var(--text-color-secondary);
                line-height: 1.6;
                max-width: 48rem;
            }

            .pending-hero-card__badge {
                min-width: 150px;
                border-radius: 1rem;
                padding: 1rem 1.25rem;
                background: var(--surface-50);
                border: 1px solid var(--surface-border);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.35rem;
            }

            .pending-hero-card__badge span {
                font-size: 2.4rem;
                font-weight: 700;
                color: var(--text-color);
                line-height: 1;
            }

            .pending-hero-card__badge small {
                color: var(--text-color-secondary);
                font-size: 0.9rem;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(6, minmax(0, 1fr));
                gap: 1rem;
                align-items: stretch;
            }

            .employee-stats-grid {
                grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            .stat-card {
                padding: 1.25rem;
                min-height: 105px;
                height: 100%;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-self: stretch;
            }

            .stat-card--highlight {
                border: 1px solid var(--primary-color);
                box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary-color) 20%, transparent);
            }

            .stat-card__label {
                color: var(--text-color-secondary);
                font-size: 0.95rem;
                margin-bottom: 0.75rem;
                line-height: 1.35;
            }

            .stat-card__value {
                font-size: 2rem;
                font-weight: 700;
                color: var(--text-color);
                line-height: 1;
            }

            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 1rem;
            }

            .panel-card__header h3 {
                margin: 0;
                font-size: 1.35rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .panel-card__header p {
                margin: 0.5rem 0 1.25rem 0;
                color: var(--text-color-secondary);
            }

            .panel-card__header--with-action {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
            }

            .bars-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .bar-row__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.4rem;
                color: var(--text-color);
            }

            .bar-track {
                width: 100%;
                height: 12px;
                border-radius: 999px;
                background: var(--surface-200);
                overflow: hidden;
            }

            .bar-fill {
                height: 100%;
                border-radius: 999px;
            }

            .bar-fill--draft {
                background: #94a3b8;
            }

            .bar-fill--open {
                background: #22c55e;
            }

            .bar-fill--closed {
                background: #ef4444;
            }

            .bar-fill--info {
                background: #3b82f6;
            }

            .bar-fill--pending {
                background: #f59e0b;
            }

            .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 1rem;
            }

            .summary-box {
                border: 1px solid var(--surface-border);
                border-radius: 1rem;
                padding: 1rem;
                background: var(--surface-50);
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .summary-box span {
                color: var(--text-color-secondary);
            }

            .summary-box strong {
                font-size: 1.5rem;
                color: var(--text-color);
                word-break: break-word;
            }

            @media (max-width: 1200px) {
                .stats-grid,
                .employee-stats-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .dashboard-grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 768px) {
                .dashboard-hero__content,
                .pending-hero-card__content,
                .panel-card__header--with-action {
                    flex-direction: column;
                }

                .dashboard-actions {
                    width: 100%;
                    flex-direction: column;
                }

                .summary-grid {
                    grid-template-columns: 1fr;
                }

                .dashboard-title {
                    font-size: 2rem;
                }

                .pending-hero-card__title {
                    font-size: 1.65rem;
                }

                .pending-hero-card__badge {
                    width: 100%;
                }
            }
        `
    ]
})
export class Dashboard implements OnInit {
    private encuestaService = inject(EncuestaService);
    private cdr = inject(ChangeDetectorRef);

    dashboardAdmin: DashboardAdminResponse | null = null;
    dashboardEmpleado: DashboardEmpleadoResponse | null = null;
    loading = false;
    errorMessage = '';

    usuarioLogueado: UsuarioLogueado | null = null;

    ngOnInit(): void {
        this.cargarUsuarioLogueado();
        this.cargarDashboard();
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
            console.error('No se pudo leer auth_user desde storage:', error);
            this.usuarioLogueado = null;
        }
    }

    get rolUsuario(): string {
        return this.usuarioLogueado?.rol?.toUpperCase() || '';
    }

    get nombreCompletoUsuario(): string {
        if (!this.usuarioLogueado) {
            return '';
        }

        return `${this.usuarioLogueado.nombre || ''} ${this.usuarioLogueado.apellido || ''}`.trim();
    }

    cargarDashboard(): void {
        this.loading = true;
        this.errorMessage = '';
        this.cdr.detectChanges();

        if (this.rolUsuario === 'ADMIN') {
            this.encuestaService.obtenerDashboardAdmin().subscribe({
                next: (data) => {
                    this.dashboardAdmin = data;
                    this.dashboardEmpleado = null;
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Error al cargar dashboard admin:', error);
                    this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudo cargar el dashboard.';
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
            return;
        }

        if (this.usuarioLogueado?.id) {
            this.encuestaService.obtenerDashboardEmpleado(this.usuarioLogueado.id).subscribe({
                next: (data) => {
                    this.dashboardEmpleado = data;
                    this.dashboardAdmin = null;
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Error al cargar dashboard empleado:', error);
                    this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudo cargar el dashboard.';
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
            return;
        }

        this.errorMessage = 'No se encontró el usuario logueado.';
        this.loading = false;
        this.cdr.detectChanges();
    }

    getPercent(valor: number): number {
        if (!this.dashboardAdmin || this.dashboardAdmin.totalEncuestas === 0) {
            return 0;
        }

        return (valor / this.dashboardAdmin.totalEncuestas) * 100;
    }

    getPercentEmpleado(valor: number): number {
        if (!this.dashboardEmpleado) {
            return 0;
        }

        const totalBase = this.dashboardEmpleado.encuestasPendientes + this.dashboardEmpleado.encuestasRespondidas + this.dashboardEmpleado.encuestasCerradas;
        if (totalBase === 0) {
            return 0;
        }

        return (valor / totalBase) * 100;
    }

    getPromedioRespuestasAdmin(): string {
        if (!this.dashboardAdmin || this.dashboardAdmin.totalEncuestas === 0) {
            return '0';
        }

        return (this.dashboardAdmin.totalRespuestas / this.dashboardAdmin.totalEncuestas).toFixed(1);
    }

    getEstadoTexto(estado: string): string {
        switch (estado) {
            case 'DRAFT':
                return 'Borrador';
            case 'OPEN':
                return 'Abierta';
            case 'CLOSED':
                return 'Cerrada';
            default:
                return estado;
        }
    }

    getEstadoSeverity(estado: string): 'secondary' | 'success' | 'danger' {
        switch (estado) {
            case 'DRAFT':
                return 'secondary';
            case 'OPEN':
                return 'success';
            case 'CLOSED':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleString();
    }
}