import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EncuestaService, RespuestaEncuestaDetalleAdminResponse, ResultadoEncuestaAdminResponse } from '../../service/encuesta.service';

@Component({
    selector: 'app-resultados-encuestas',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, InputTextModule, SelectModule, DialogModule, CheckboxModule],
    template: `
        <div class="resultados-page">
            <section class="card resultados-hero">
                <div class="resultados-hero__content">
                    <div>
                        <h1 class="resultados-title">Resultados de encuestas</h1>
                        <p class="resultados-subtitle">Revisa quién respondió cada encuesta, filtra resultados y exporta Excel general o individual.</p>
                    </div>
                </div>
            </section>

            <div *ngIf="loadingEncuestas" class="card">Cargando encuestas...</div>

            <div *ngIf="errorMessage" class="card text-red-500 font-medium">
                {{ errorMessage }}
            </div>

            <div *ngIf="successMessage" class="card text-green-600 font-medium">
                {{ successMessage }}
            </div>

            <section class="card">
                <p-table [value]="encuestas" [tableStyle]="{ 'min-width': '82rem' }" responsiveLayout="scroll">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>ID</th>
                            <th>Título</th>
                            <th>Descripción</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Preguntas</th>
                            <th>Respuestas</th>
                            <th>Fecha</th>
                            <th style="width: 280px">Acciones</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-encuesta>
                        <tr>
                            <td>{{ encuesta.encuestaId }}</td>
                            <td>{{ encuesta.titulo }}</td>
                            <td>{{ encuesta.descripcion || 'Sin descripción' }}</td>
                            <td>
                                <p-tag [value]="encuesta.modoCalificable ? 'Cuestionario' : 'Encuesta'" [severity]="encuesta.modoCalificable ? 'warn' : 'info'"></p-tag>
                            </td>
                            <td>
                                <p-tag [value]="getEstadoTexto(encuesta.estado)" [severity]="getEstadoSeverity(encuesta.estado)"></p-tag>
                            </td>
                            <td>{{ encuesta.cantidadPreguntas }}</td>
                            <td>{{ encuesta.cantidadRespuestas }}</td>
                            <td>{{ formatearFecha(encuesta.fechaCreacion) }}</td>
                            <td>
                                <div class="flex gap-2 flex-wrap">
                                    <button pButton type="button" label="Ver respuestas" icon="pi pi-eye" [disabled]="encuesta.cantidadRespuestas === 0" (click)="verRespuestas(encuesta)"></button>

                                    <button
                                        pButton
                                        type="button"
                                        label="Excel general"
                                        icon="pi pi-file-excel"
                                        severity="success"
                                        [disabled]="!puedeExportar(encuesta.estado) || encuesta.cantidadRespuestas === 0 || exportandoId === encuesta.encuestaId"
                                        [loading]="exportandoId === encuesta.encuestaId"
                                        (click)="exportarExcel(encuesta)"
                                    ></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="9" class="text-center py-4">No hay encuestas registradas.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section class="card" *ngIf="encuestaSeleccionada">
                <div class="detalle-header">
                    <div>
                        <h3 class="m-0 text-900">Participantes de: {{ encuestaSeleccionada.titulo }}</h3>
                        <p class="text-600 mt-2 mb-0">Aquí solo se muestra el participante, correo, fecha y hora de respuesta. Cada respuesta puede exportarse por separado.</p>
                    </div>
                </div>

                <div class="filters-grid">
                    <div class="filter-item">
                        <label class="filter-label">Buscar por participante o correo</label>
                        <input pInputText [(ngModel)]="filtroTextoRespuesta" (input)="aplicarFiltrosRespuestas()" class="w-full" placeholder="Ejemplo: tebans o hur@gmail.com" />
                    </div>

                    <div class="filter-item">
                        <label class="filter-label">Año</label>
                        <p-select [options]="opcionesAnios" [(ngModel)]="anioSeleccionado" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" (onChange)="aplicarFiltrosRespuestas()"></p-select>
                    </div>

                    <div class="filter-item">
                        <label class="filter-label">Mes</label>
                        <p-select [options]="opcionesMeses" [(ngModel)]="mesSeleccionado" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" (onChange)="aplicarFiltrosRespuestas()"></p-select>
                    </div>

                    <div class="filter-item">
                        <label class="filter-label">Día</label>
                        <p-select [options]="opcionesDias" [(ngModel)]="diaSeleccionado" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" (onChange)="aplicarFiltrosRespuestas()"></p-select>
                    </div>

                    <div class="filter-actions">
                        <button pButton type="button" label="Limpiar filtros" severity="secondary" [outlined]="true" (click)="limpiarFiltrosRespuestas()"></button>
                    </div>
                </div>

                <div class="results-counter">
                    Total respuestas visibles: <strong>{{ respuestasFiltradas.length }}</strong>
                </div>

                <div *ngIf="loadingRespuestas" class="mb-4">Cargando respuestas...</div>

                <div *ngIf="!loadingRespuestas && respuestasFiltradas.length === 0" class="text-600">No hay respuestas que coincidan con los filtros.</div>

                <div *ngFor="let respuesta of respuestasFiltradas" class="respuesta-card border surface-border border-round-xl p-4 mb-4">
                    <div class="respuesta-card__top">
                        <div>
                            <h4 class="respuesta-nombre">{{ respuesta.nombreParticipante }}</h4>
                            <p class="respuesta-correo">{{ respuesta.correoParticipante || 'Sin correo' }}</p>
                        </div>

                        <div class="respuesta-tags">
                            <p-tag value="Respondida" severity="success"></p-tag>
                            <p-tag [value]="formatearSoloFecha(respuesta.fechaRespuesta)" severity="info"></p-tag>
                            <p-tag [value]="formatearSoloHora(respuesta.fechaRespuesta)" severity="contrast"></p-tag>
                        </div>
                    </div>

                    <div class="respuesta-info-grid">
                        <div class="respuesta-info-box">
                            <span class="respuesta-info-label">Participante</span>
                            <strong>{{ respuesta.nombreParticipante || 'Sin nombre' }}</strong>
                        </div>

                        <div class="respuesta-info-box">
                            <span class="respuesta-info-label">Correo</span>
                            <strong>{{ respuesta.correoParticipante || 'Sin correo' }}</strong>
                        </div>

                        <div class="respuesta-info-box">
                            <span class="respuesta-info-label">Fecha</span>
                            <strong>{{ formatearSoloFecha(respuesta.fechaRespuesta) }}</strong>
                        </div>

                        <div class="respuesta-info-box">
                            <span class="respuesta-info-label">Hora</span>
                            <strong>{{ formatearSoloHora(respuesta.fechaRespuesta) }}</strong>
                        </div>
                    </div>

                    <div class="respuesta-actions">
                        <button
                            pButton
                            type="button"
                            label="Excel individual"
                            icon="pi pi-file-excel"
                            severity="success"
                            [disabled]="exportandoRespuestaId === respuesta.idRespuesta"
                            [loading]="exportandoRespuestaId === respuesta.idRespuesta"
                            (click)="exportarRespuestaIndividual(respuesta)"
                        ></button>

                        <button
                            pButton
                            type="button"
                            label="Eliminar respuesta"
                            icon="pi pi-trash"
                            severity="danger"
                            [disabled]="eliminandoRespuestaId === respuesta.idRespuesta"
                            [loading]="eliminandoRespuestaId === respuesta.idRespuesta"
                            (click)="abrirDialogoEliminarRespuesta(respuesta)"
                        ></button>
                    </div>
                </div>
            </section>
        </div>

        <p-dialog header="Confirmar eliminación de respuesta" [(visible)]="mostrarDialogoEliminarRespuesta" [modal]="true" [style]="{ width: '32rem', 'max-width': '95vw' }" [closable]="!eliminandoRespuestaId" [draggable]="false" [resizable]="false">
            <div class="pt-2">
                <p class="m-0">
                    ¿Seguro que deseas eliminar la respuesta de
                    <strong>{{ respuestaSeleccionadaEliminar?.nombreParticipante }}</strong
                    >?
                </p>

                <p class="text-600 mt-3 mb-3">Esta acción eliminará el registro completo de esa respuesta.</p>

                <div class="flex align-items-center gap-2">
                    <p-checkbox [(ngModel)]="confirmacionEliminarRespuesta" binary inputId="confirmacionEliminarRespuesta"></p-checkbox>
                    <label for="confirmacionEliminarRespuesta"> Confirmo que deseo eliminar esta respuesta </label>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="cerrarDialogoEliminarRespuesta()" [disabled]="!!eliminandoRespuestaId"></button>

                    <button pButton type="button" label="Eliminar" severity="danger" (click)="eliminarRespuesta()" [disabled]="!confirmacionEliminarRespuesta || !!eliminandoRespuestaId"></button>
                </div>
            </ng-template>
        </p-dialog>
    `,
    styles: [
        `
            .resultados-page {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .resultados-hero {
                padding: 1.5rem;
            }

            .resultados-hero__content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1.5rem;
            }

            .resultados-title {
                margin: 0;
                font-size: 2.2rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .resultados-subtitle {
                margin: 0.85rem 0 0 0;
                color: var(--text-color-secondary);
                max-width: 60rem;
                line-height: 1.6;
            }

            .detalle-header {
                margin-bottom: 1rem;
            }

            .filters-grid {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr auto;
                gap: 1rem;
                align-items: end;
                margin-bottom: 1rem;
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

            .results-counter {
                margin-bottom: 1rem;
                color: var(--text-color);
                font-size: 1rem;
            }

            .respuesta-card__top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .respuesta-nombre {
                margin: 0;
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .respuesta-correo {
                margin: 0.6rem 0 0 0;
                color: var(--text-color-secondary);
            }

            .respuesta-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                align-items: center;
            }

            .respuesta-info-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .respuesta-info-box {
                border: 1px solid var(--surface-border);
                border-radius: 1rem;
                background: var(--surface-50);
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            .respuesta-info-label {
                color: var(--text-color-secondary);
                font-size: 0.9rem;
            }

            .respuesta-actions {
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
                margin-top: 0.5rem;
                flex-wrap: wrap;
            }

            @media (max-width: 1100px) {
                .filters-grid {
                    grid-template-columns: 1fr 1fr;
                }

                .respuesta-card__top {
                    flex-direction: column;
                }

                .respuesta-info-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }

            @media (max-width: 700px) {
                .filters-grid,
                .respuesta-info-grid {
                    grid-template-columns: 1fr;
                }
            }
        `
    ]
})
export class ResultadosEncuestas implements OnInit {
    private encuestaService = inject(EncuestaService);
    private cdr = inject(ChangeDetectorRef);

    encuestas: ResultadoEncuestaAdminResponse[] = [];
    respuestas: RespuestaEncuestaDetalleAdminResponse[] = [];
    respuestasFiltradas: RespuestaEncuestaDetalleAdminResponse[] = [];
    encuestaSeleccionada: ResultadoEncuestaAdminResponse | null = null;

    loadingEncuestas = false;
    loadingRespuestas = false;
    exportandoId: number | null = null;
    exportandoRespuestaId: number | null = null;
    eliminandoRespuestaId: number | null = null;

    errorMessage = '';
    successMessage = '';

    filtroTextoRespuesta = '';
    anioSeleccionado: number | null = null;
    mesSeleccionado: number | null = null;
    diaSeleccionado: number | null = null;

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

    mostrarDialogoEliminarRespuesta = false;
    respuestaSeleccionadaEliminar: RespuestaEncuestaDetalleAdminResponse | null = null;
    confirmacionEliminarRespuesta = false;

    ngOnInit(): void {
        this.opcionesDias = [{ label: 'Todos', value: null }];
        for (let i = 1; i <= 31; i++) {
            this.opcionesDias.push({ label: String(i), value: i });
        }

        this.cargarEncuestas();
    }

    cargarEncuestas(): void {
        this.loadingEncuestas = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        this.encuestaService.listarEncuestasConResultados().subscribe({
            next: (data) => {
                this.encuestas = data;
                this.loadingEncuestas = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar resultados:', error);
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudieron cargar los resultados.';
                this.loadingEncuestas = false;
                this.cdr.detectChanges();
            }
        });
    }

    verRespuestas(encuesta: ResultadoEncuestaAdminResponse): void {
        this.encuestaSeleccionada = encuesta;
        this.respuestas = [];
        this.respuestasFiltradas = [];
        this.loadingRespuestas = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.limpiarFiltrosRespuestas(false);
        this.cdr.detectChanges();

        this.encuestaService.listarRespuestasPorEncuesta(encuesta.encuestaId).subscribe({
            next: (data) => {
                this.respuestas = data;
                this.construirOpcionesAnios();
                this.aplicarFiltrosRespuestas();
                this.loadingRespuestas = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar respuestas:', error);
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudieron cargar las respuestas.';
                this.loadingRespuestas = false;
                this.cdr.detectChanges();
            }
        });
    }

    construirOpcionesAnios(): void {
        const anios = Array.from(new Set(this.respuestas.filter((respuesta) => !!respuesta.fechaRespuesta).map((respuesta) => new Date(respuesta.fechaRespuesta).getFullYear()))).sort((a, b) => b - a);
        this.opcionesAnios = [{ label: 'Todos', value: null }, ...anios.map((anio) => ({ label: String(anio), value: anio }))];
    }

    aplicarFiltrosRespuestas(): void {
        const texto = this.filtroTextoRespuesta.trim().toLowerCase();

        this.respuestasFiltradas = this.respuestas.filter((respuesta) => {
            const fecha = new Date(respuesta.fechaRespuesta);
            const nombre = (respuesta.nombreParticipante || '').toLowerCase();
            const correo = (respuesta.correoParticipante || '').toLowerCase();

            const coincideTexto = !texto || nombre.includes(texto) || correo.includes(texto);
            const coincideAnio = this.anioSeleccionado == null || fecha.getFullYear() === this.anioSeleccionado;
            const coincideMes = this.mesSeleccionado == null || fecha.getMonth() + 1 === this.mesSeleccionado;
            const coincideDia = this.diaSeleccionado == null || fecha.getDate() === this.diaSeleccionado;

            return coincideTexto && coincideAnio && coincideMes && coincideDia;
        });

        this.cdr.detectChanges();
    }

    limpiarFiltrosRespuestas(refrescarVista = true): void {
        this.filtroTextoRespuesta = '';
        this.anioSeleccionado = null;
        this.mesSeleccionado = null;
        this.diaSeleccionado = null;

        if (refrescarVista) {
            this.aplicarFiltrosRespuestas();
        }
    }

    exportarExcel(encuesta: ResultadoEncuestaAdminResponse): void {
        this.errorMessage = '';
        this.successMessage = '';
        this.exportandoId = encuesta.encuestaId;
        this.cdr.detectChanges();

        this.encuestaService.exportarEncuestaExcel(encuesta.encuestaId).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `encuesta_${encuesta.encuestaId}_general.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);

                this.successMessage = 'Archivo Excel general exportado correctamente.';
                this.exportandoId = null;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al exportar Excel:', error);
                this.errorMessage = 'No se pudo exportar el archivo Excel.';
                this.exportandoId = null;
                this.cdr.detectChanges();
            }
        });
    }

    exportarRespuestaIndividual(respuesta: RespuestaEncuestaDetalleAdminResponse): void {
        this.errorMessage = '';
        this.successMessage = '';
        this.exportandoRespuestaId = respuesta.idRespuesta;
        this.cdr.detectChanges();

        this.encuestaService.exportarRespuestaIndividualExcel(respuesta.idRespuesta).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `respuesta_${respuesta.idRespuesta}_individual.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);

                this.successMessage = 'Archivo Excel individual exportado correctamente.';
                this.exportandoRespuestaId = null;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al exportar Excel individual:', error);
                this.errorMessage = 'No se pudo exportar el archivo Excel individual.';
                this.exportandoRespuestaId = null;
                this.cdr.detectChanges();
            }
        });
    }

    abrirDialogoEliminarRespuesta(respuesta: RespuestaEncuestaDetalleAdminResponse): void {
        this.respuestaSeleccionadaEliminar = respuesta;
        this.confirmacionEliminarRespuesta = false;
        this.mostrarDialogoEliminarRespuesta = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();
    }

    cerrarDialogoEliminarRespuesta(): void {
        if (this.eliminandoRespuestaId) {
            return;
        }

        this.mostrarDialogoEliminarRespuesta = false;
        this.respuestaSeleccionadaEliminar = null;
        this.confirmacionEliminarRespuesta = false;
        this.cdr.detectChanges();
    }

    eliminarRespuesta(): void {
        if (!this.respuestaSeleccionadaEliminar) {
            return;
        }

        this.eliminandoRespuestaId = this.respuestaSeleccionadaEliminar.idRespuesta;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        this.encuestaService.eliminarRespuestaAdmin(this.respuestaSeleccionadaEliminar.idRespuesta).subscribe({
            next: () => {
                this.successMessage = 'Respuesta eliminada correctamente.';
                this.eliminandoRespuestaId = null;
                this.mostrarDialogoEliminarRespuesta = false;
                this.confirmacionEliminarRespuesta = false;
                this.respuestaSeleccionadaEliminar = null;

                if (this.encuestaSeleccionada) {
                    this.verRespuestas(this.encuestaSeleccionada);
                }

                this.cargarEncuestas();
            },
            error: (error) => {
                console.error('Error al eliminar respuesta:', error);
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudo eliminar la respuesta.';
                this.eliminandoRespuestaId = null;
                this.cdr.detectChanges();
            }
        });
    }

    puedeExportar(estado: string): boolean {
        return estado === 'OPEN' || estado === 'CLOSED';
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

    formatearSoloFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString();
    }

    formatearSoloHora(fecha: string): string {
        return new Date(fecha).toLocaleTimeString();
    }
}
