import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { FechaCortaPipe, FechaHoraPipe } from '../../../../shared/pipes/formato.pipe';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, AuditoriaRegistro, MedicareOutboxItem, Metodologia } from '../../services/cies.service';

interface FiltrosAuditoria {
    tipo: string;
    usuario: string;
    resultado: string;
    fechaInicio: Date | null;
    fechaFin: Date | null;
}

@Component({
    selector: 'app-auditoria-page',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, DatePickerModule, DialogModule, InputTextModule,
        SelectModule, TableModule, TagModule, TextareaModule, Toast, TabsModule, TooltipModule, BadgeModule,
        FechaCortaPipe, FechaHoraPipe, CiesInfoHintComponent
    ],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <!-- HEADER -->
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--morado">
                        <i class="pi pi-shield"></i> Seguridad y Trazabilidad
                    </div>
                    <h1 class="cies-hero__title">Auditoría del Sistema</h1>
                    <p class="cies-hero__copy">
                        Consulta el historial completo de eventos, cambios metodológicos, integración con Medicare
                        y versionamiento de la metodología CIES.
                    </p>
                </div>
            </section>

            <!-- TABS PRINCIPALES -->
            <p-tabs value="0" [style]="{ marginTop: '1.5rem' }">
                <p-tablist>
                    <p-tab value="0"><i class="pi pi-list" style="margin-right:.4rem"></i>Auditoría general</p-tab>
                    <p-tab value="1"><i class="pi pi-share-alt" style="margin-right:.4rem"></i>Integración Medicare</p-tab>
                    <p-tab value="2"><i class="pi pi-history" style="margin-right:.4rem"></i>Versiones metodológicas</p-tab>
                </p-tablist>
                <p-tabpanels>

                    <!-- ==================== TAB 1: Auditoría ==================== -->
                    <p-tabpanel value="0">
                    <!-- Filtros -->
                    <div class="card">
                        <div class="cies-section-head cies-section-head--clickable" (click)="filtersExpanded = !filtersExpanded">
                            <div class="cies-section-head__content">
                                <div>
                                    <h3>Filtros de búsqueda</h3>
                                    <p>Refina los resultados por tipo de evento, usuario, resultado o rango de fechas.</p>
                                </div>
                                <div style="display:flex;align-items:center;gap:0.5rem">
                                    <app-cies-info-hint text="Cada registro muestra quién hizo qué, cuándo y con qué resultado." (click)="$event.stopPropagation()"></app-cies-info-hint>
                                    <i class="pi" [class.pi-chevron-down]="!filtersExpanded" [class.pi-chevron-up]="filtersExpanded"
                                        style="font-size:1rem;color:var(--text-color-secondary);transition:transform 0.2s"></i>
                                </div>
                            </div>
                        </div>

                        <div class="cies-form-grid cies-form-grid--three" *ngIf="filtersExpanded">
                            <div>
                                <label>Tipo de Evento</label>
                                <p-select [options]="tipoEventos" [(ngModel)]="filtros.tipo"
                                    optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                    placeholder="Todos los eventos"></p-select>
                            </div>
                            <div>
                                <label>Usuario</label>
                                <input pInputText [(ngModel)]="filtros.usuario" class="w-full"
                                    placeholder="Buscar por usuario o email..." />
                            </div>
                            <div>
                                <label>Resultado</label>
                                <p-select [options]="resultadoOptions" [(ngModel)]="filtros.resultado"
                                    optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                    placeholder="Todos"></p-select>
                            </div>
                            <div>
                                <label>Fecha Inicio</label>
                                <p-datepicker [(ngModel)]="filtros.fechaInicio" dateFormat="yy-mm-dd"
                                    class="w-full" [showIcon]="true" placeholder="Desde..."></p-datepicker>
                            </div>
                            <div>
                                <label>Fecha Fin</label>
                                <p-datepicker [(ngModel)]="filtros.fechaFin" dateFormat="yy-mm-dd"
                                    class="w-full" [showIcon]="true" placeholder="Hasta..."></p-datepicker>
                            </div>
                            <div class="cies-field--full cies-filters-actions">
                                <button pButton type="button" label="Buscar" icon="pi pi-search"
                                    [loading]="loading" (click)="buscar(true)"></button>
                                <button pButton type="button" label="Limpiar filtros" icon="pi pi-eraser"
                                    severity="secondary" [outlined]="true" (click)="limpiarFiltros()"></button>
                            </div>
                        </div>
                    </div>

                    <!-- Cargando inicial -->
                    <div class="card" *ngIf="loading && !registros.length">
                        <div class="cies-empty-state">
                            <div class="cies-empty-state__icon"><i class="pi pi-spin pi-spinner"></i></div>
                            <h3>Cargando registros de auditoría...</h3>
                        </div>
                    </div>

                    <!-- Resultados -->
                    <div class="card" *ngIf="registros.length">
                        <div class="cies-section-head">
                            <div class="cies-section-head__content">
                                <div>
                                    <h3>Registros de auditoría</h3>
                                    <p>{{ totalRegistros }} evento(s) encontrado(s) en total.</p>
                                </div>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <p-tag [value]="totalRegistros + ' registros'" severity="info"></p-tag>
                                </div>
                            </div>
                        </div>

                        <p-table [value]="registros" [tableStyle]="{ 'min-width': '72rem' }"
                            responsiveLayout="scroll" [paginator]="true" [rows]="pageSize"
                            [rowsPerPageOptions]="[10, 15, 25, 50]" [loading]="loading"
                            [lazy]="true" [totalRecords]="totalRegistros" [first]="pageIndex * pageSize"
                            [sortField]="sortField" [sortOrder]="sortOrder"
                            (onLazyLoad)="onPageChange($any($event))"
                            class="cies-table">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th pSortableColumn="fechaHora">Fecha/Hora <p-sortIcon field="fechaHora"></p-sortIcon></th>
                                    <th pSortableColumn="tipo">Tipo <p-sortIcon field="tipo"></p-sortIcon></th>
                                    <th pSortableColumn="usuario">Usuario <p-sortIcon field="usuario"></p-sortIcon></th>
                                    <th>Descripción</th>
                                    <th>Entidad</th>
                                    <th>IP</th>
                                    <th pSortableColumn="resultado">Resultado <p-sortIcon field="resultado"></p-sortIcon></th>
                                    <th style="width: 5rem">Acciones</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td style="white-space: nowrap; font-size: 0.82rem;">{{ item.fechaHora | fechaHora }}</td>
                                    <td>
                                        <p-tag [value]="getTipoLabel(item.tipo)"
                                            [severity]="getTipoSeverity(item.tipo)"
                                            [style]="{ 'font-size': '0.72rem' }"></p-tag>
                                    </td>
                                    <td style="font-size: 0.85rem;">{{ item.usuario }}</td>
                                    <td style="font-size: 0.85rem; max-width: 20rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                        [pTooltip]="descripcionAuditoria(item.descripcion)" tooltipPosition="top">
                                        {{ descripcionAuditoria(item.descripcion) }}
                                    </td>
                                    <td style="font-size: 0.82rem;">
                                        <span *ngIf="item.entidadAfectada">{{ item.entidadAfectada }} #{{ item.idEntidad || '—' }}</span>
                                        <span *ngIf="!item.entidadAfectada">—</span>
                                    </td>
                                    <td style="font-size: 0.82rem; font-family: monospace;">{{ item.direccionIp || '—' }}</td>
                                    <td>
                                        <p-tag [value]="getResultadoLabel(item.resultado)"
                                            [severity]="item.resultado === 'EXITO' ? 'success' : item.resultado === 'ERROR' ? 'danger' : 'warn'"
                                            [style]="{ 'font-size': '0.72rem' }"></p-tag>
                                    </td>
                                    <td>
                                        <button pButton type="button" icon="pi pi-eye" text rounded severity="info" size="small"
                                            pTooltip="Ver detalle completo"
                                            (click)="verDetalle(item)"></button>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>

                    <!-- Empty state -->
                    <div class="card" *ngIf="!registros.length && busquedaRealizada && !loading">
                        <div class="cies-empty-state">
                            <div class="cies-empty-state__icon"><i class="pi pi-search"></i></div>
                            <h3>No se encontraron registros</h3>
                            <p>Intenta ajustar los filtros de búsqueda para ver más resultados.</p>
                        </div>
                    </div>
                </p-tabpanel>

                <!-- ==================== TAB 2: Outbox Medicare ==================== -->
                <p-tabpanel value="1">
                    <div class="card">
                        <div class="cies-section-head">
                            <div class="cies-section-head__content">
                                <div>
                                    <h3>Trazas de integración Medicare</h3>
                                    <p>Registros técnicos de salida para soporte y auditoría de integración con Medicare.</p>
                                </div>
                                <div class="cies-section-actions">
                                    <p-tag [value]="totalOutbox + ' registros'" severity="contrast"></p-tag>
                                    <button pButton type="button" label="Actualizar" icon="pi pi-refresh"
                                        size="small" severity="secondary" [outlined]="true"
                                        (click)="cargarOutbox()"></button>
                                </div>
                            </div>
                            <app-cies-info-hint text="Datos técnicos para diagnóstico de fallos en la integración con Medicare."></app-cies-info-hint>
                        </div>

                        <div *ngIf="!loadingOutbox && !totalOutbox" class="cies-empty-state">
                            <div class="cies-empty-state__icon"><i class="pi pi-check-circle"></i></div>
                            <h3>No hay registros pendientes en el outbox</h3>
                            <p>Todas las integraciones con Medicare se han sincronizado correctamente.</p>
                        </div>

                        <p-table *ngIf="totalOutbox" [value]="outbox" [tableStyle]="{ 'min-width': '52rem' }"
                            responsiveLayout="scroll" [paginator]="true" [lazy]="true" [rows]="outboxRows"
                            [first]="outboxPage * outboxRows" [totalRecords]="totalOutbox"
                            [rowsPerPageOptions]="[10, 20, 50]" [loading]="loadingOutbox"
                            (onLazyLoad)="onOutboxLazyLoad($any($event))" class="cies-table">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Tipo</th>
                                    <th>Referencia ID</th>
                                    <th>Fecha</th>
                                    <th style="width: 5rem">Acciones</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td>
                                        <p-tag [value]="item.tipo" severity="info"
                                            [style]="{ 'font-size': '0.75rem' }"></p-tag>
                                    </td>
                                    <td style="font-family: monospace; font-size: 0.85rem;">{{ item.referenciaId }}</td>
                                    <td>{{ item.fecha | fechaHora }}</td>
                                    <td>
                                        <button pButton type="button" icon="pi pi-code" text rounded severity="contrast" size="small"
                                            pTooltip="Ver payload JSON"
                                            (click)="verPayloadOutbox(item)"></button>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </p-tabpanel>

                <!-- ==================== TAB 3: Versionamiento Metodológico ==================== -->
                <p-tabpanel value="2">
                    <div class="card">
                        <div class="cies-section-head">
                            <div class="cies-section-head__content">
                                <div>
                                    <h3>Historial de versiones metodológicas</h3>
                                    <p>Cada cambio en ponderaciones, umbrales o fórmulas genera una nueva versión auditable.</p>
                                </div>
                                <app-cies-info-hint text="Cada encuesta queda asociada a la versión vigente al momento de su aplicación."></app-cies-info-hint>
                            </div>
                        </div>

                        <div *ngIf="!metodologias.length" class="cies-empty-state">
                            <div class="cies-empty-state__icon"><i class="pi pi-sliders-h"></i></div>
                            <h3>No hay metodologías registradas</h3>
                            <p>El sistema necesita al menos una configuración metodológica para funcionar.</p>
                        </div>

                        <!-- Timeline de versiones -->
                        <div *ngIf="metodologias.length" class="versiones-timeline">
                            <div *ngFor="let m of metodologias; let i = index"
                                class="version-card"
                                [class.version-activa]="m.activa">
                                <div class="version-header">
                                    <div class="version-number">v{{ metodologias.length - i }}</div>
                                    <div class="version-info">
                                        <h4>{{ m.nombre }}</h4>
                                        <p>{{ m.descripcion || 'Sin descripción' }}</p>
                                    </div>
                                    <div class="version-badges">
                                        <p-tag *ngIf="m.activa" value="ACTIVA" severity="success" icon="pi pi-check"></p-tag>
                                        <p-tag *ngIf="!m.activa" value="Histórica" severity="info"></p-tag>
                                    </div>
                                </div>
                                <div class="version-details">
                                    <div class="version-detail-row">
                                        <span class="detail-label"><i class="pi pi-calendar"></i> Creada:</span>
                                        <span class="detail-value">{{ m.fechaCreacion | fechaHora }}</span>
                                    </div>
                                    <div class="version-detail-row">
                                        <span class="detail-label"><i class="pi pi-user"></i> Creada por:</span>
                                        <span class="detail-value">{{ m.creadoPor || 'Sistema' }}</span>
                                    </div>
                                    <div class="version-detail-row">
                                        <span class="detail-label"><i class="pi pi-flag"></i> Umbral Pobre:</span>
                                        <span class="detail-value">{{ m.umbralPobre }} puntos</span>
                                    </div>
                                    <div class="version-detail-row">
                                        <span class="detail-label"><i class="pi pi-ban"></i> Umbral Excluida:</span>
                                        <span class="detail-value">{{ m.umbralExcluido }} puntos</span>
                                    </div>
                                    <div class="version-detail-row">
                                        <span class="detail-label"><i class="pi pi-exclamation-triangle"></i> Umbral Subatendida:</span>
                                        <span class="detail-value">{{ m.umbralSubatendido }} puntos</span>
                                    </div>
                                    <div class="version-detail-row">
                                        <span class="detail-label"><i class="pi pi-list"></i> Preguntas:</span>
                                        <span class="detail-value">{{ m.preguntas.length || 0 }} configuradas</span>
                                    </div>
                                    <div class="version-detail-row" *ngIf="m.comentarioCambio">
                                        <span class="detail-label"><i class="pi pi-comment"></i> Comentario:</span>
                                        <span class="detail-value detail-comment">{{ m.comentarioCambio }}</span>
                                    </div>
                                </div>
                                <div class="version-formula" *ngIf="m.formulaTexto">
                                    <strong><i class="pi pi-calculator"></i> Fórmula:</strong>
                                    <code>{{ m.formulaTexto }}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </p-tabpanel>
            </p-tabpanels>
        </p-tabs>

            <!-- ===================== DIALOG: Detalle de auditoría ===================== -->
            <p-dialog [(visible)]="showDetalle" [modal]="true"
                [style]="{ width: '60rem', 'max-width': '96vw' }"
                [draggable]="false" [resizable]="false"
                header="Detalle del evento"
                styleClass="cies-dialog">
                <div *ngIf="registroSeleccionado" class="detalle-container">
                    <!-- Info básica -->
                    <div class="detalle-section">
                        <h4>Información General</h4>
                        <div class="detalle-grid">
                            <div class="detalle-field">
                                <label>Tipo de Evento</label>
                                <p-tag [value]="getTipoLabel(registroSeleccionado.tipo)"
                                    [severity]="getTipoSeverity(registroSeleccionado.tipo)"></p-tag>
                            </div>
                            <div class="detalle-field">
                                <label>Resultado</label>
                                <p-tag [value]="getResultadoLabel(registroSeleccionado.resultado)"
                                    [severity]="registroSeleccionado.resultado === 'EXITO' ? 'success' : registroSeleccionado.resultado === 'ERROR' ? 'danger' : 'warn'"></p-tag>
                            </div>
                            <div class="detalle-field">
                                <label>Fecha y hora</label>
                                <span>{{ registroSeleccionado.fechaHora | fechaHora }}</span>
                            </div>
                            <div class="detalle-field">
                                <label>Usuario</label>
                                <span>{{ registroSeleccionado.usuario }}</span>
                            </div>
                            <div class="detalle-field">
                                <label>Entidad Afectada</label>
                                <span>{{ registroSeleccionado.entidadAfectada || '—' }} #{{ registroSeleccionado.idEntidad || '—' }}</span>
                            </div>
                            <div class="detalle-field">
                                <label>Dirección IP</label>
                                <span style="font-family: monospace;">{{ registroSeleccionado.direccionIp || '—' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Descripción -->
                    <div class="detalle-section">
                        <h4>Descripción</h4>
                        <p class="detalle-descripcion">{{ descripcionAuditoria(registroSeleccionado.descripcion) }}</p>
                    </div>

                    <!-- Datos anteriores -->
                    <div class="detalle-section detalle-change-card detalle-change-card--before" *ngIf="registroSeleccionado.datosAnteriores">
                        <h4><i class="pi pi-history"></i> Datos anteriores (antes del cambio)</h4>
                        <pre class="detalle-json">{{ formatAuditData(registroSeleccionado.datosAnteriores) }}</pre>
                    </div>

                    <!-- Datos nuevos -->
                    <div class="detalle-section detalle-change-card detalle-change-card--after" *ngIf="registroSeleccionado.datosNuevos">
                        <h4><i class="pi pi-check"></i> Datos nuevos (después del cambio)</h4>
                        <pre class="detalle-json">{{ formatAuditData(registroSeleccionado.datosNuevos) }}</pre>
                    </div>

                </div>

                <ng-template pTemplate="footer">
                    <button pButton type="button" label="Cerrar" severity="secondary" [outlined]="true"
                        (click)="showDetalle = false"></button>
                </ng-template>
            </p-dialog>

            <!-- ===================== DIALOG: Payload JSON ===================== -->
            <p-dialog [(visible)]="showPayloadDialog" [modal]="true"
                [style]="{ width: '50rem', 'max-width': '92vw' }"
                [draggable]="false" [resizable]="false"
                header="Payload JSON"
                styleClass="cies-dialog">
                <pre class="payload-json-display">{{ selectedPayloadJson }}</pre>
                <ng-template pTemplate="footer">
                    <button pButton type="button" label="Cerrar" severity="secondary" [outlined]="true"
                        (click)="showPayloadDialog = false"></button>
                </ng-template>
            </p-dialog>
        </div>

        <p-toast></p-toast>
    `,
    styles: [`
        .versiones-timeline {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
        }

        .version-card {
            border: 1px solid var(--surface-border);
            border-radius: 0.75rem;
            padding: 1.25rem;
            background: var(--surface-card);
            transition: all 0.2s ease;
        }

        .version-card:hover {
            border-color: var(--primary-color);
        }

        .version-card.version-activa {
            border-color: #22c55e;
            border-width: 2px;
            background: rgba(34, 197, 94, 0.04);
        }

        .version-header {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .version-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            background: var(--primary-color);
            color: var(--primary-color-text);
            font-size: 0.85rem;
            font-weight: 700;
            flex-shrink: 0;
        }

        .version-activa .version-number {
            background: #22c55e;
        }

        .version-info {
            flex: 1;
            min-width: 0;
        }

        .version-info h4 {
            margin: 0 0 0.2rem;
            font-size: 1rem;
        }

        .version-info p {
            margin: 0;
            font-size: 0.85rem;
            color: var(--text-color-secondary);
        }

        .version-badges {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        .version-details {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
            gap: 0.5rem 1.5rem;
            padding: 0.75rem;
            background: var(--surface-ground);
            border-radius: 0.5rem;
            margin-bottom: 0.75rem;
        }

        .version-detail-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
        }

        .detail-label {
            font-weight: 600;
            color: var(--text-color-secondary);
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        .detail-label i {
            font-size: 0.85rem;
            color: var(--primary-color);
        }

        .cies-section-head--clickable {
            cursor: pointer;
            user-select: none;
            border-radius: 0.5rem;
            transition: background 0.15s ease;
        }

        .cies-section-head--clickable:hover {
            background: color-mix(in srgb, var(--surface-ground) 60%, transparent);
        }

        .cies-filters-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
            justify-content: flex-end;
            padding-top: 0.5rem;
        }

        .cies-section-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
        }

        @media (max-width: 720px) {
            .cies-filters-actions { justify-content: stretch; }
            .cies-filters-actions button { flex: 1 1 auto; }
            .version-header { flex-wrap: wrap; }
            .version-badges { width: 100%; }
        }

        .detail-value {
            color: var(--text-color);
        }

        .detail-comment {
            font-style: italic;
            color: var(--text-color-secondary);
        }

        .version-formula {
            padding: 0.75rem;
            background: var(--surface-ground);
            border-radius: 0.5rem;
            font-size: 0.85rem;
        }

        .version-formula strong {
            display: block;
            margin-bottom: 0.3rem;
        }

        .version-formula code {
            font-family: monospace;
            background: var(--surface-card);
            padding: 0.3rem 0.5rem;
            border-radius: 0.3rem;
            display: block;
            overflow-x: auto;
        }

        .detalle-container {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        .detalle-section h4 {
            margin: 0 0 0.5rem;
            font-size: 0.92rem;
            color: var(--text-color);
        }

        .detalle-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }

        .detalle-field {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            min-width: 0;
            padding: 0.75rem;
            border: 1px solid var(--surface-border);
            border-radius: 8px;
            background: color-mix(in srgb, var(--surface-card) 86%, var(--surface-ground));
        }

        .detalle-field label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-color-secondary);
            text-transform: uppercase;
        }

        .detalle-field span {
            font-size: 0.88rem;
            overflow-wrap: anywhere;
        }

        .detalle-descripcion {
            font-size: 0.9rem;
            line-height: 1.5;
            color: var(--text-color);
            margin: 0;
            padding: 0.9rem 1rem;
            background: color-mix(in srgb, var(--primary-color) 7%, var(--surface-card));
            border: 1px solid color-mix(in srgb, var(--primary-color) 18%, var(--surface-border));
            border-radius: 8px;
        }

        .detalle-change-card {
            overflow: hidden;
            border: 1px solid var(--surface-border);
            border-radius: 8px;
            background: var(--surface-card);
        }

        .detalle-change-card h4 {
            display: flex;
            align-items: center;
            margin: 0;
            padding: 0.85rem 1rem;
            border-bottom: 1px solid var(--surface-border);
            background: color-mix(in srgb, var(--surface-ground) 70%, transparent);
        }

        .detalle-change-card--before {
            border-color: color-mix(in srgb, #f59e0b 30%, var(--surface-border));
        }

        .detalle-change-card--after {
            border-color: color-mix(in srgb, #22c55e 30%, var(--surface-border));
        }

        .detalle-json {
            font-family: monospace;
            font-size: 0.8rem;
            line-height: 1.5;
            background: color-mix(in srgb, var(--surface-ground) 82%, var(--surface-card));
            padding: 0.9rem;
            max-height: 18rem;
            overflow-y: auto;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            word-break: normal;
            margin: 0;
        }

        .payload-json-display {
            font-family: monospace;
            font-size: 0.82rem;
            line-height: 1.5;
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 0.5rem;
            padding: 1rem;
            max-height: 30rem;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
            margin: 0;
        }

        @media (max-width: 768px) {
            .detalle-grid {
                grid-template-columns: 1fr;
            }

            .version-header {
                flex-direction: column;
            }

            .version-details {
                grid-template-columns: 1fr;
            }

            .version-badges {
                width: 100%;
                justify-content: flex-start;
            }
        }
    `]
})
export class AuditoriaPage implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);
    private ciesService = inject(CiesService);

    registros: AuditoriaRegistro[] = [];
    outbox: MedicareOutboxItem[] = [];
    totalOutbox = 0;
    outboxPage = 0;
    outboxRows = 10;
    loadingOutbox = false;
    metodologias: Metodologia[] = [];
    showDetalle = false;
    showPayloadDialog = false;
    registroSeleccionado: AuditoriaRegistro | null = null;
    selectedPayloadJson = '';
    busquedaRealizada = false;
    loading = false;
    filtersExpanded = true;
    pageIndex = 0;
    pageSize = 15;
    totalRegistros = 0;
    sortField = 'fechaHora';
    sortOrder: 1 | -1 = -1;

    filtros: FiltrosAuditoria = {
        tipo: '',
        usuario: '',
        resultado: '',
        fechaInicio: null,
        fechaFin: null
    };

    tipoEventos = [
        { label: 'Todos los eventos', value: '' },
        { label: 'Acceso de usuario', value: 'ACCESO_USUARIO' },
        { label: 'Cambio de metodología', value: 'CAMBIOS_METODOLOGIA' },
        { label: 'Selección aleatoria', value: 'SELECCION_ALEATORIA' },
        { label: 'Inicio de entrevista', value: 'INICIO_ENTREVISTA' },
        { label: 'Finalización de entrevista', value: 'FINALIZACION_ENTREVISTA' },
        { label: 'Cálculo de clasificación', value: 'CALCULO_CLASIFICACION' },
        { label: 'Exportación de reporte', value: 'EXPORTACION_REPORTE' },
        { label: 'Creación de usuario', value: 'CREACION_USUARIO' },
        { label: 'Modificación de usuario', value: 'MODIFICACION_USUARIO' },
        { label: 'Eliminación de usuario', value: 'ELIMINACION_USUARIO' },
        { label: 'Creación de lote', value: 'CREACION_LOTE' },
        { label: 'Eliminación de lote', value: 'ELIMINACION_LOTE' },
        { label: 'Integración Medicare', value: 'INTEGRACION_MEDICARE' }
    ];

    resultadoOptions = [
        { label: 'Todos', value: '' },
        { label: 'Éxito', value: 'EXITO' },
        { label: 'Error', value: 'ERROR' },
        { label: 'Parcial', value: 'PARCIAL' }
    ];

    ngOnInit(): void {
        this.buscar(true);
        this.cargarOutbox();
        this.cargarMetodologias();
    }

    cargarOutbox(page = this.outboxPage, size = this.outboxRows): void {
        this.loadingOutbox = true;
        this.ciesService.getMedicareOutboxPaginado(page, size).subscribe({
            next: (response) => {
                if (!response.content.length && response.totalElements > 0 && page > 0) {
                    this.cargarOutbox(page - 1, size);
                    return;
                }

                this.outbox = response.content;
                this.totalOutbox = response.totalElements;
                this.outboxPage = response.page;
                this.outboxRows = response.size;
                this.loadingOutbox = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.loadingOutbox = false;
                console.error('Error cargando outbox:', error);
            }
        });
    }

    onOutboxLazyLoad(event: { first?: number; rows?: number }): void {
        const rows = event.rows || this.outboxRows;
        const page = Math.floor((event.first || 0) / rows);
        this.cargarOutbox(page, rows);
    }

    cargarMetodologias(): void {
        this.ciesService.listMetodologias().subscribe({
            next: (response) => {
                this.metodologias = response.sort((a, b) => {
                    if (a.activa) return -1;
                    if (b.activa) return 1;
                    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
                });
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error cargando metodologías:', error);
            }
        });
    }

    buscar(resetPage = false): void {
        if (resetPage) {
            this.pageIndex = 0;
        }

        this.loading = true;
        this.busquedaRealizada = true;

        const params: Record<string, string | number | null | undefined> = {
            page: this.pageIndex,
            size: this.pageSize,
            sortField: this.sortField,
            sortOrder: this.sortOrder
        };
        if (this.filtros.tipo) params['tipo'] = this.filtros.tipo;
        if (this.filtros.usuario) params['usuario'] = this.filtros.usuario;
        if (this.filtros.resultado) params['resultado'] = this.filtros.resultado;
        if (this.filtros.fechaInicio) params['fechaInicio'] = this.formatLocalDateTime(this.filtros.fechaInicio, false);
        if (this.filtros.fechaFin) params['fechaFin'] = this.formatLocalDateTime(this.filtros.fechaFin, true);

        this.ciesService.listAuditoria(params).subscribe({
            next: (response) => {
                this.registros = response.content || [];
                this.totalRegistros = response.totalElements || 0;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loading = false;
                console.error('Error buscando auditoría:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(err, 'No se pudieron cargar los registros de auditoría.')
                });
                this.registros = [];
                this.totalRegistros = 0;
                this.cdr.detectChanges();
            }
        });
    }

    onPageChange(event: { first?: number; rows?: number; sortField?: string | string[] | null; sortOrder?: number | null }): void {
        const rows = event.rows || this.pageSize;
        const nextSortField = this.resolveSortField(event.sortField);
        const nextSortOrder = event.sortOrder === 1 ? 1 : -1;
        const sortChanged = nextSortField !== this.sortField || nextSortOrder !== this.sortOrder;

        this.pageSize = rows;
        this.pageIndex = sortChanged ? 0 : Math.floor((event.first || 0) / rows);
        this.sortField = nextSortField;
        this.sortOrder = nextSortOrder;
        this.buscar();
    }

    private resolveSortField(sortField: string | string[] | null | undefined): string {
        if (Array.isArray(sortField)) {
            return sortField[0] || 'fechaHora';
        }
        return sortField || 'fechaHora';
    }

    private formatLocalDateTime(date: Date, endOfDay: boolean): string {
        const normalized = new Date(date);
        if (endOfDay) {
            normalized.setHours(23, 59, 59, 999);
        } else {
            normalized.setHours(0, 0, 0, 0);
        }

        const pad = (value: number, length = 2) => String(value).padStart(length, '0');
        return [
            normalized.getFullYear(),
            '-',
            pad(normalized.getMonth() + 1),
            '-',
            pad(normalized.getDate()),
            'T',
            pad(normalized.getHours()),
            ':',
            pad(normalized.getMinutes()),
            ':',
            pad(normalized.getSeconds())
        ].join('');
    }

    private extractErrorMessage(error: unknown, fallback: string): string {
        const payload = error as {
            error?: { message?: string; detail?: string; error?: string };
            message?: string;
        } | null;

        return payload?.error?.message
            || payload?.error?.detail
            || payload?.error?.error
            || payload?.message
            || fallback;
    }

    limpiarFiltros(): void {
        this.filtros = {
            tipo: '',
            usuario: '',
            resultado: '',
            fechaInicio: null,
            fechaFin: null
        };
        this.buscar(true);
    }

    verDetalle(registro: AuditoriaRegistro): void {
        this.registroSeleccionado = registro;
        this.showDetalle = true;
    }

    verPayloadOutbox(item: MedicareOutboxItem): void {
        this.selectedPayloadJson = item.payloadJson;
        this.showPayloadDialog = true;
    }

    getTipoLabel(tipo: string): string {
        const map: Record<string, string> = {
            'ACCESO_USUARIO': 'Acceso Usuario',
            'CAMBIOS_METODOLOGIA': 'Cambio Metodología',
            'SELECCION_ALEATORIA': 'Selección Aleatoria',
            'INICIO_ENTREVISTA': 'Inicio Entrevista',
            'FINALIZACION_ENTREVISTA': 'Fin Entrevista',
            'CALCULO_CLASIFICACION': 'Cálculo Clasificación',
            'EXPORTACION_REPORTE': 'Exportación Reporte',
            'CREACION_USUARIO': 'Creación Usuario',
            'MODIFICACION_USUARIO': 'Modificación Usuario',
            'ELIMINACION_USUARIO': 'Eliminación Usuario',
            'CREACION_LOTE': 'Creación Lote',
            'ELIMINACION_LOTE': 'Eliminación Lote',
            'INTEGRACION_MEDICARE': 'Integración Medicare',
            'LOGIN': 'Login',
            'LOGOUT': 'Logout',
            'REFRESH_TOKEN': 'Refresh Token'
        };
        return map[tipo] || tipo;
    }

    getResultadoLabel(resultado: string): string {
        const map: Record<string, string> = {
            'EXITO': 'Éxito',
            'ERROR': 'Error',
            'PARCIAL': 'Parcial',
            'FAILED': 'Fallido',
            'SUCCESS': 'Éxito'
        };
        return map[resultado] || resultado;
    }

    getTipoSeverity(tipo: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        if (tipo.includes('CREACION') || tipo.includes('INICIO') || tipo.includes('ACCESO') || tipo.includes('LOGIN')) return 'success';
        if (tipo.includes('ELIMINACION') || tipo.includes('ERROR') || tipo.includes('FAILED')) return 'danger';
        if (tipo.includes('MODIFICACION') || tipo.includes('CAMBIO')) return 'warn';
        return 'info';
    }

    descripcionAuditoria(descripcion?: string): string {
        const texto = descripcion?.trim() || 'Sin descripción';
        return texto.replace(/[A-Za-z0-9+/]{160,}={0,2}/g, 'dato sensible protegido');
    }

    formatAuditData(jsonStr: string): string {
        return this.descripcionAuditoria(this.formatJsonSafe(jsonStr));
    }

    formatJsonSafe(jsonStr: string): string {
        try {
            const parsed = JSON.parse(jsonStr);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return jsonStr;
        }
    }
}
