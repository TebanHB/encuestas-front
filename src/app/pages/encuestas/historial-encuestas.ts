import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EncuestaResponse, EncuestaService, EstadoEncuesta } from '../../service/encuesta.service';

@Component({
    selector: 'app-historial-encuestas',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, SelectModule, InputTextModule, DialogModule],
    template: `
        <div class="historial-page">
            <section class="card historial-hero">
                <div class="historial-hero__content">
                    <div>
                        <h1 class="historial-title">Historial de encuestas</h1>
                        <p class="historial-subtitle">Visualiza, filtra, cambia estado, edita o elimina encuestas creadas en el sistema.</p>
                    </div>
                </div>

                <div class="filters-grid">
                    <div class="filter-item">
                        <label class="filter-label">Buscar por nombre</label>
                        <input pInputText [(ngModel)]="filtroTitulo" (input)="aplicarFiltros()" class="w-full" placeholder="Ejemplo: satisfacción" />
                    </div>

                    <div class="filter-item">
                        <label class="filter-label">Año</label>
                        <p-select [options]="opcionesAnios" [(ngModel)]="anioSeleccionado" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" appendTo="body" (onChange)="aplicarFiltros()"></p-select>
                    </div>

                    <div class="filter-item">
                        <label class="filter-label">Mes</label>
                        <p-select [options]="opcionesMeses" [(ngModel)]="mesSeleccionado" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" appendTo="body" (onChange)="aplicarFiltros()"></p-select>
                    </div>

                    <div class="filter-item">
                        <label class="filter-label">Día</label>
                        <p-select [options]="opcionesDias" [(ngModel)]="diaSeleccionado" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" appendTo="body" (onChange)="aplicarFiltros()"></p-select>
                    </div>

                    <div class="filter-actions">
                        <button pButton type="button" label="Limpiar filtros" severity="secondary" [outlined]="true" (click)="limpiarFiltros()"></button>
                    </div>
                </div>
            </section>

            <div *ngIf="loading" class="card">Cargando encuestas...</div>

            <div *ngIf="errorMessage" class="card text-red-500 font-medium">
                {{ errorMessage }}
            </div>

            <div *ngIf="successMessage" class="card text-green-600 font-medium">
                {{ successMessage }}
            </div>

            <section class="card">
                <p-table [value]="encuestasFiltradas" [tableStyle]="{ 'min-width': '88rem' }" responsiveLayout="scroll">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>ID</th>
                            <th>Título</th>
                            <th>Descripción</th>
                            <th>Tipo</th>
                            <th>Preguntas</th>
                            <th>Estado actual</th>
                            <th>Fecha</th>
                            <th>Cambiar estado</th>
                            <th style="width: 260px">Acciones</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-encuesta>
                        <tr>
                            <td>{{ encuesta.id }}</td>
                            <td>{{ encuesta.titulo }}</td>
                            <td>{{ encuesta.descripcion || 'Sin descripción' }}</td>
                            <td>
                                <p-tag [value]="encuesta.modoCalificable ? 'Calificable' : 'Normal'" [severity]="encuesta.modoCalificable ? 'warn' : 'info'"></p-tag>
                            </td>
                            <td>{{ encuesta.cantidadPreguntas }}</td>
                            <td>
                                <p-tag [value]="getEstadoTexto(encuesta.estado)" [severity]="getEstadoSeverity(encuesta.estado)"></p-tag>
                            </td>
                            <td>{{ formatearFecha(encuesta.fechaCreacion) }}</td>
                            <td>
                                <div class="estado-cell">
                                    <p-select [options]="estadosDisponibles" [(ngModel)]="estadoSeleccionadoPorEncuesta[encuesta.id]" optionLabel="label" optionValue="value" class="w-full" appendTo="body"></p-select>

                                    <button pButton type="button" icon="pi pi-check" severity="success" [disabled]="actualizandoEstadoId === encuesta.id" [loading]="actualizandoEstadoId === encuesta.id" (click)="actualizarEstado(encuesta)"></button>
                                </div>
                            </td>
                            <td>
                                <div class="acciones-cell">
                                    <button pButton type="button" label="Editar" icon="pi pi-pencil" severity="info" (click)="editarEncuesta(encuesta)"></button>

                                    <button
                                        pButton
                                        type="button"
                                        label="Eliminar"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        [disabled]="eliminandoEncuestaId === encuesta.id"
                                        [loading]="eliminandoEncuestaId === encuesta.id"
                                        (click)="confirmarEliminarEncuesta(encuesta)"
                                    ></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="9" class="text-center py-4">No hay encuestas que coincidan con los filtros.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>

        <p-dialog header="Confirmar eliminación" [(visible)]="mostrarDialogoEliminar" [modal]="true" [style]="{ width: '30rem', 'max-width': '95vw' }" [closable]="!eliminandoEncuestaId" [draggable]="false" [resizable]="false">
            <div class="pt-2">
                <p class="m-0">
                    ¿Seguro que deseas eliminar la encuesta
                    <strong>{{ encuestaSeleccionadaEliminar?.titulo }}</strong
                    >?
                </p>

                <p class="text-600 mt-3 mb-0">Esta acción solo debería hacerse en encuestas creadas por error.</p>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="cerrarDialogoEliminar()" [disabled]="!!eliminandoEncuestaId"></button>
                    <button pButton type="button" label="Eliminar" severity="danger" (click)="eliminarEncuesta()" [disabled]="!!eliminandoEncuestaId"></button>
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [
        `
            .historial-page {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .historial-hero {
                padding: 1.5rem;
            }

            .historial-hero__content {
                margin-bottom: 1.25rem;
            }

            .historial-title {
                margin: 0;
                font-size: 2.2rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .historial-subtitle {
                margin: 0.85rem 0 0 0;
                color: var(--text-color-secondary);
                line-height: 1.6;
                max-width: 60rem;
            }

            .filters-grid {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr auto;
                gap: 1rem;
                align-items: end;
            }

            .filter-item {
                min-width: 0;
            }

            .filter-label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 600;
                color: var(--text-color);
            }

            .filter-actions {
                display: flex;
                align-items: end;
            }

            .estado-cell {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                min-width: 240px;
            }

            .acciones-cell {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }

            @media (max-width: 1100px) {
                .filters-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }

            @media (max-width: 700px) {
                .filters-grid {
                    grid-template-columns: 1fr;
                }

                .acciones-cell,
                .estado-cell {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
        `
    ]
})
export class HistorialEncuestas implements OnInit {
    private encuestaService = inject(EncuestaService);
    private cdr = inject(ChangeDetectorRef);
    private router = inject(Router);

    encuestas: EncuestaResponse[] = [];
    encuestasFiltradas: EncuestaResponse[] = [];

    loading = false;
    errorMessage = '';
    successMessage = '';

    actualizandoEstadoId: number | null = null;
    eliminandoEncuestaId: number | null = null;

    mostrarDialogoEliminar = false;
    encuestaSeleccionadaEliminar: EncuestaResponse | null = null;

    filtroTitulo = '';
    anioSeleccionado: number | null = null;
    mesSeleccionado: number | null = null;
    diaSeleccionado: number | null = null;

    estadoSeleccionadoPorEncuesta: Record<number, EstadoEncuesta> = {};

    estadosDisponibles = [
        { label: 'Borrador', value: 'DRAFT' as EstadoEncuesta },
        { label: 'Abierta', value: 'OPEN' as EstadoEncuesta },
        { label: 'Cerrada', value: 'CLOSED' as EstadoEncuesta }
    ];

    opcionesAnios: { label: string; value: number | null }[] = [];
    opcionesMeses = [
        { label: 'Todos', value: null },
        { label: 'Enero', value: 1 },
        { label: 'Febrero', value: 2 },
        { label: 'Marzo', value: 3 },
        { label: 'Abril', value: 4 },
        { label: 'Mayo', value: 5 },
        { label: 'Junio', value: 6 },
        { label: 'Julio', value: 7 },
        { label: 'Agosto', value: 8 },
        { label: 'Septiembre', value: 9 },
        { label: 'Octubre', value: 10 },
        { label: 'Noviembre', value: 11 },
        { label: 'Diciembre', value: 12 }
    ];
    opcionesDias: { label: string; value: number | null }[] = [];

    ngOnInit(): void {
        this.opcionesDias = [{ label: 'Todos', value: null }];
        for (let i = 1; i <= 31; i++) {
            this.opcionesDias.push({ label: String(i), value: i });
        }

        this.cargarEncuestas();
    }

    cargarEncuestas(): void {
        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        this.encuestaService.listarEncuestas().subscribe({
            next: (data) => {
                this.encuestas = [...data].sort((a, b) => {
                    const fechaA = new Date(a.fechaCreacion).getTime();
                    const fechaB = new Date(b.fechaCreacion).getTime();
                    return fechaB - fechaA;
                });

                this.estadoSeleccionadoPorEncuesta = {};
                this.encuestas.forEach((encuesta) => {
                    this.estadoSeleccionadoPorEncuesta[encuesta.id] = encuesta.estado;
                });

                this.construirOpcionesAnios();
                this.aplicarFiltros();

                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar historial de encuestas:', error);
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudo cargar el historial de encuestas.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    construirOpcionesAnios(): void {
        const anios = Array.from(new Set(this.encuestas.filter((encuesta) => !!encuesta.fechaCreacion).map((encuesta) => new Date(encuesta.fechaCreacion).getFullYear()))).sort((a, b) => b - a);

        this.opcionesAnios = [{ label: 'Todos', value: null }, ...anios.map((anio) => ({ label: String(anio), value: anio }))];
    }

    aplicarFiltros(): void {
        const texto = this.filtroTitulo.trim().toLowerCase();

        this.encuestasFiltradas = this.encuestas.filter((encuesta) => {
            const fecha = new Date(encuesta.fechaCreacion);
            const coincideTitulo = !texto || encuesta.titulo.toLowerCase().includes(texto);

            const coincideAnio = this.anioSeleccionado == null || fecha.getFullYear() === this.anioSeleccionado;
            const coincideMes = this.mesSeleccionado == null || fecha.getMonth() + 1 === this.mesSeleccionado;
            const coincideDia = this.diaSeleccionado == null || fecha.getDate() === this.diaSeleccionado;

            return coincideTitulo && coincideAnio && coincideMes && coincideDia;
        });

        this.cdr.detectChanges();
    }

    limpiarFiltros(): void {
        this.filtroTitulo = '';
        this.anioSeleccionado = null;
        this.mesSeleccionado = null;
        this.diaSeleccionado = null;
        this.aplicarFiltros();
    }

    actualizarEstado(encuesta: EncuestaResponse): void {
        const nuevoEstado = this.estadoSeleccionadoPorEncuesta[encuesta.id];

        if (!nuevoEstado || nuevoEstado === encuesta.estado) {
            return;
        }

        this.actualizandoEstadoId = encuesta.id;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        this.encuestaService.cambiarEstado(encuesta.id, nuevoEstado).subscribe({
            next: () => {
                this.successMessage = 'Estado actualizado correctamente.';
                this.actualizandoEstadoId = null;
                this.cargarEncuestas();
            },
            error: (error) => {
                console.error('Error al cambiar estado:', error);
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudo actualizar el estado.';
                this.estadoSeleccionadoPorEncuesta[encuesta.id] = encuesta.estado;
                this.actualizandoEstadoId = null;
                this.cdr.detectChanges();
            }
        });
    }

    editarEncuesta(encuesta: EncuestaResponse): void {
        this.router.navigate(['/pages/encuestas/editar', encuesta.id]);
    }

    confirmarEliminarEncuesta(encuesta: EncuestaResponse): void {
        this.encuestaSeleccionadaEliminar = encuesta;
        this.mostrarDialogoEliminar = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();
    }

    cerrarDialogoEliminar(): void {
        if (this.eliminandoEncuestaId) {
            return;
        }

        this.mostrarDialogoEliminar = false;
        this.encuestaSeleccionadaEliminar = null;
        this.cdr.detectChanges();
    }

    eliminarEncuesta(): void {
        if (!this.encuestaSeleccionadaEliminar) {
            return;
        }

        this.eliminandoEncuestaId = this.encuestaSeleccionadaEliminar.id;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        this.encuestaService.eliminarEncuesta(this.encuestaSeleccionadaEliminar.id).subscribe({
            next: () => {
                this.successMessage = 'Encuesta eliminada correctamente.';
                this.eliminandoEncuestaId = null;
                this.mostrarDialogoEliminar = false;
                this.encuestaSeleccionadaEliminar = null;
                this.cargarEncuestas();
            },
            error: (error) => {
                console.error('Error al eliminar encuesta:', error);
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudo eliminar la encuesta.';
                this.eliminandoEncuestaId = null;
                this.mostrarDialogoEliminar = false;
                this.encuestaSeleccionadaEliminar = null;
                this.cdr.detectChanges();
            }
        });
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
