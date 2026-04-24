import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { forkJoin } from 'rxjs';
import { NumeroFormatoPipe } from '../../../../shared/pipes/formato.pipe';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, DistribucionVariable, Metodologia, ReporteResumen } from '../../services/cies.service';

interface ReportFilters {
    anio: string;
    fechaDesde: Date | null;
    fechaHasta: Date | null;
    regional: string;
    clinica: string;
    version: string;
    clasificacion: string;
    codigoVariable: string;
}

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-reporteria-page',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, ChartModule, InputTextModule, SelectModule,
        TableModule, Toast, TabsModule, TagModule, ProgressBarModule, TooltipModule, DatePickerModule,
        BadgeModule, OverlayBadgeModule,
        NumeroFormatoPipe, CiesInfoHintComponent
    ],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <!-- HEADER -->
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--azul">
                        <i class="pi pi-chart-line"></i> Reportería y Analítica
                    </div>
                    <h1 class="cies-hero__title">Indicadores institucionales</h1>
                    <p class="cies-hero__copy">
                        Consulta el consolidado nacional, comparativos por clínica y distribuciones del instrumento.
                        Filtra por tiempo, sede o versión metodológica y exporta en múltiples formatos.
                    </p>
                </div>
                <div class="cies-hero__actions">
                    <button pButton type="button" label="Ver todo" icon="pi pi-eye"
                        severity="secondary" [outlined]="true" [disabled]="loading || downloading" (click)="resetFilters()"></button>
                    <button pButton type="button" label="Excel" icon="pi pi-file-excel"
                        severity="success" [loading]="downloading" [disabled]="loading || downloading || !resumen" (click)="download('excel')"></button>
                    <button pButton type="button" label="CSV" icon="pi pi-download"
                        severity="secondary" [loading]="downloading" [disabled]="loading || downloading || !resumen" (click)="download('csv')"></button>
                    <button pButton type="button" label="SPSS" icon="pi pi-database"
                        severity="contrast" [loading]="downloading" [disabled]="loading || downloading || !resumen" (click)="download('sps')"></button>
                </div>
            </section>

            <!-- GUÍA RÁPIDA -->
            <section class="cies-guidance-grid">
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">1</div>
                    <div class="cies-stack">
                        <h4>Empieza viendo todo</h4>
                        <p>Si no estás seguro de qué filtro usar, primero mira el panorama general.</p>
                    </div>
                </article>
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">2</div>
                    <div class="cies-stack">
                        <h4>Filtra solo si lo necesitas</h4>
                        <p>Usa año, regional o clínica solo cuando quieras responder una pregunta puntual.</p>
                    </div>
                </article>
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">3</div>
                    <div class="cies-stack">
                        <h4>Exporta al final</h4>
                        <p>Descarga Excel, CSV o SPSS desde la misma pantalla de resultados.</p>
                    </div>
                </article>
            </section>

            <!-- FILTROS -->
            <section class="card cies-filter-card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Filtros de análisis</h3>
                            <p>Acota la reportería por tiempo, sede, versión metodológica, clasificación y variable.</p>
                        </div>
                        <app-cies-info-hint text="Los filtros afectan los indicadores, gráficos, comparativos y archivos exportados."></app-cies-info-hint>
                    </div>
                    <span class="cies-filter-count" *ngIf="activeFilterCount">
                        {{ activeFilterCount }} {{ activeFilterCount === 1 ? 'filtro activo' : 'filtros activos' }}
                    </span>
                </div>
                <div class="cies-filter-grid">
                    <div class="cies-filter-field cies-filter-field--short">
                        <label>Año</label>
                        <input pInputText [(ngModel)]="filters.anio" class="w-full" placeholder="Ej: 2026"
                            inputmode="numeric" maxlength="4" />
                    </div>
                    <div class="cies-filter-field cies-filter-field--date">
                        <label>Fecha desde</label>
                        <p-datepicker [(ngModel)]="filters.fechaDesde" dateFormat="yy-mm-dd"
                            appendTo="body" class="w-full" [showIcon]="true" placeholder="Desde"></p-datepicker>
                    </div>
                    <div class="cies-filter-field cies-filter-field--date">
                        <label>Fecha hasta</label>
                        <p-datepicker [(ngModel)]="filters.fechaHasta" dateFormat="yy-mm-dd"
                            appendTo="body" class="w-full" [showIcon]="true" placeholder="Hasta"></p-datepicker>
                    </div>
                    <div class="cies-filter-field">
                        <label>Regional</label>
                        <p-select [options]="regionalOptions" [(ngModel)]="filters.regional"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas"></p-select>
                    </div>
                    <div class="cies-filter-field">
                        <label>Clínica</label>
                        <p-select [options]="clinicaOptions" [(ngModel)]="filters.clinica"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas"></p-select>
                    </div>
                    <div class="cies-filter-field cies-filter-field--wide">
                        <label>Versión metodológica</label>
                        <p-select [options]="versionOptions" [(ngModel)]="filters.version"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas"></p-select>
                    </div>
                    <div class="cies-filter-field">
                        <label>Clasificación</label>
                        <p-select [options]="clasificaciones" [(ngModel)]="filters.clasificacion"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas"></p-select>
                    </div>
                    <div class="cies-filter-field cies-filter-field--variable">
                        <label>Variable</label>
                        <p-select [options]="variableOptions" [(ngModel)]="filters.codigoVariable"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Selecciona una variable"></p-select>
                    </div>
                    <div class="cies-filter-actions">
                        <button pButton type="button" label="Aplicar filtros" icon="pi pi-filter"
                            [loading]="loading" [disabled]="loading || downloading" (click)="load()"></button>
                        <button pButton type="button" label="Limpiar" severity="secondary"
                            [outlined]="true" icon="pi pi-times" [disabled]="loading || downloading" (click)="resetFilters()"></button>
                    </div>
                </div>
            </section>

            <!-- TABS DE REPORTERÍA -->
            <p-tabs value="0" [style]="{ marginTop: '1.5rem' }" *ngIf="resumen && hasResults">
                <p-tablist>
                    <p-tab value="0">Resumen General</p-tab>
                    <p-tab value="1">Tendencias</p-tab>
                    <p-tab value="2">Comparativo por Clínica</p-tab>
                    <p-tab value="3">Distribución por Variable</p-tab>
                </p-tablist>
                <p-tabpanels>

                <!-- TAB 1: Resumen General -->
                <p-tabpanel value="0">
                    <!-- KPIs -->
                    <section class="cies-stats-grid">
                        <article class="card cies-stat-card">
                            <div class="cies-card-caption">
                                <span>Total entrevistas</span>
                                <app-cies-info-hint text="Número de entrevistas incluidas en el análisis actual."></app-cies-info-hint>
                            </div>
                            <strong style="font-size: 2rem;">{{ resumen.totalEntrevistas | numeroFormato }}</strong>
                        </article>
                        <article class="card cies-stat-card card-stat--pobre">
                            <div class="cies-card-caption">
                                <span>Vulnerables</span>
                                <app-cies-info-hint text="Total clasificadas como pobreza."></app-cies-info-hint>
                            </div>
                            <strong style="font-size: 2rem; color: #ef4444;">{{ resumen.totalPobres | numeroFormato }}</strong>
                            <span class="stat-percent">{{ resumen.porcentajePobres }}%</span>
                        </article>
                        <article class="card cies-stat-card card-stat--excluido">
                            <div class="cies-card-caption">
                                <span>Excluidas</span>
                                <app-cies-info-hint text="Total clasificadas como exclusión."></app-cies-info-hint>
                            </div>
                            <strong style="font-size: 2rem; color: #f59e0b;">{{ resumen.totalExcluidas | numeroFormato }}</strong>
                            <span class="stat-percent">{{ resumen.porcentajeExcluidas }}%</span>
                        </article>
                        <article class="card cies-stat-card card-stat--subatendido">
                            <div class="cies-card-caption">
                                <span>Subatendidas</span>
                                <app-cies-info-hint text="Total clasificadas como subatención."></app-cies-info-hint>
                            </div>
                            <strong style="font-size: 2rem; color: #0ea5e9;">{{ resumen.totalSubatendidas | numeroFormato }}</strong>
                            <span class="stat-percent">{{ resumen.porcentajeSubatendidas }}%</span>
                        </article>
                    </section>

                    <!-- Barras de progreso -->
                    <section class="card" style="margin-top: 1rem;">
                        <h4 style="margin: 0 0 1rem; font-size: 0.95rem;">Distribución porcentual</h4>
                        <div class="progress-bars-container">
                            <div class="progress-bar-item">
                                <div class="progress-bar-label">
                                    <span class="dot dot--pobre"></span>
                                    <span>Vulnerables</span>
                                    <strong>{{ resumen.porcentajePobres }}%</strong>
                                </div>
                                <p-progressBar [value]="resumen.porcentajePobres" [style]="{ height: '12px' }"
                                    styleClass="progress-bar--pobre"></p-progressBar>
                            </div>
                            <div class="progress-bar-item">
                                <div class="progress-bar-label">
                                    <span class="dot dot--excluido"></span>
                                    <span>Excluidas</span>
                                    <strong>{{ resumen.porcentajeExcluidas }}%</strong>
                                </div>
                                <p-progressBar [value]="resumen.porcentajeExcluidas" [style]="{ height: '12px' }"
                                    styleClass="progress-bar--excluido"></p-progressBar>
                            </div>
                            <div class="progress-bar-item">
                                <div class="progress-bar-label">
                                    <span class="dot dot--subatendido"></span>
                                    <span>Subatendidas</span>
                                    <strong>{{ resumen.porcentajeSubatendidas }}%</strong>
                                </div>
                                <p-progressBar [value]="resumen.porcentajeSubatendidas" [style]="{ height: '12px' }"
                                    styleClass="progress-bar--subatendido"></p-progressBar>
                            </div>
                        </div>
                    </section>

                    <!-- Gráfico Doughnut -->
                    <section class="card cies-chart-card" style="margin-top: 1rem;">
                        <div class="cies-section-head">
                            <div>
                                <h3>Clasificación consolidada</h3>
                                <p>Distribución global según filtros vigentes.</p>
                            </div>
                        </div>
                        <div class="chart-container">
                            <p-chart type="doughnut" [data]="classificationChartData" [options]="doughnutOptions"></p-chart>
                        </div>
                    </section>
                </p-tabpanel>

                <!-- TAB 2: Tendencias -->
                <p-tabpanel value="1">
                    <section class="card cies-chart-card" *ngIf="resumen.tendencias.length">
                        <div class="cies-section-head">
                            <div>
                                <h3>Evolución temporal</h3>
                                <p>Serie anual o mensual según el año filtrado.</p>
                            </div>
                            <app-cies-info-hint text="Permite detectar cambios en el comportamiento del instrumento a lo largo del tiempo."></app-cies-info-hint>
                        </div>
                        <div class="chart-container">
                            <p-chart type="bar" [data]="tendenciasChartData" [options]="barChartOptions"></p-chart>
                        </div>
                    </section>

                    <!-- Tabla de tendencias -->
                    <section class="card" style="margin-top: 1rem;" *ngIf="resumen.tendencias.length">
                        <h4 style="margin: 0 0 1rem; font-size: 0.95rem;">Detalle de tendencias</h4>
                        <p-table [value]="resumen.tendencias" [tableStyle]="{ 'min-width': '48rem' }"
                            responsiveLayout="scroll" [paginator]="true" [rows]="5"
                            [rowsPerPageOptions]="[5, 10, 20]" class="cies-table">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Período</th>
                                    <th>Total</th>
                                    <th>Vulnerables</th>
                                    <th>Excluidas</th>
                                    <th>Subatendidas</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td><strong>{{ item.etiqueta }}</strong></td>
                                    <td>{{ item.total | numeroFormato }}</td>
                                    <td style="color: #ef4444;">{{ item.pobres | numeroFormato }}</td>
                                    <td style="color: #f59e0b;">{{ item.excluidas | numeroFormato }}</td>
                                    <td style="color: #0ea5e9;">{{ item.subatendidas | numeroFormato }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </section>
                    <section class="card cies-empty-state" *ngIf="!resumen.tendencias.length">
                        <i class="pi pi-chart-bar"></i>
                        <h3>Sin tendencias para estos filtros</h3>
                        <p>Prueba ampliando el rango de fechas, cambiando el año o limpiando los filtros.</p>
                    </section>
                </p-tabpanel>

                <!-- TAB 3: Comparativo por Clínica -->
                <p-tabpanel value="2">
                    <section class="card cies-chart-card" *ngIf="resumen.comparativoClinicas.length">
                        <div class="cies-section-head">
                            <div>
                                <h3>Comparativo entre clínicas</h3>
                                <p>Porcentaje de clasificación sobre entrevistas válidas.</p>
                            </div>
                            <app-cies-info-hint text="Compara sedes bajo el mismo criterio metodológico y los mismos filtros activos."></app-cies-info-hint>
                        </div>
                        <div class="chart-container">
                            <p-chart type="bar" [data]="clinicasChartData" [options]="horizontalChartOptions"></p-chart>
                        </div>
                    </section>

                    <!-- Tabla comparativa -->
                    <section class="card" style="margin-top: 1rem;" *ngIf="resumen.comparativoClinicas.length">
                        <h4 style="margin: 0 0 1rem; font-size: 0.95rem;">Tabla comparativa detallada</h4>
                        <p-table [value]="resumen.comparativoClinicas" [tableStyle]="{ 'min-width': '58rem' }"
                            [paginator]="true" [rows]="5" [rowsPerPageOptions]="[5, 10, 20]" responsiveLayout="scroll"
                            class="cies-table">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th pSortableColumn="clinica">Clínica <p-sortIcon field="clinica"></p-sortIcon></th>
                                    <th pSortableColumn="total">Total <p-sortIcon field="total"></p-sortIcon></th>
                                    <th pSortableColumn="porcentajePobres">% Vulnerables <p-sortIcon field="porcentajePobres"></p-sortIcon></th>
                                    <th pSortableColumn="porcentajeExcluidas">% Excluidas <p-sortIcon field="porcentajeExcluidas"></p-sortIcon></th>
                                    <th pSortableColumn="porcentajeSubatendidas">% Subatendidas <p-sortIcon field="porcentajeSubatendidas"></p-sortIcon></th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td><strong>{{ item.clinica }}</strong></td>
                                    <td>{{ item.total | numeroFormato }}</td>
                                    <td>
                                        <div class="cell-with-bar">
                                            <span style="color: #ef4444; font-weight: 600;">{{ item.porcentajePobres }}%</span>
                                            <div class="mini-bar"><div class="mini-bar-fill mini-bar--pobre" [style.width.%]="item.porcentajePobres"></div></div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-with-bar">
                                            <span style="color: #f59e0b; font-weight: 600;">{{ item.porcentajeExcluidas }}%</span>
                                            <div class="mini-bar"><div class="mini-bar-fill mini-bar--excluido" [style.width.%]="item.porcentajeExcluidas"></div></div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-with-bar">
                                            <span style="color: #0ea5e9; font-weight: 600;">{{ item.porcentajeSubatendidas }}%</span>
                                            <div class="mini-bar"><div class="mini-bar-fill mini-bar--subatendido" [style.width.%]="item.porcentajeSubatendidas"></div></div>
                                        </div>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </section>
                    <section class="card cies-empty-state" *ngIf="!resumen.comparativoClinicas.length">
                        <i class="pi pi-building"></i>
                        <h3>Sin comparativo disponible</h3>
                        <p>No hay entrevistas terminadas por clínica con los filtros seleccionados.</p>
                    </section>
                </p-tabpanel>

                <!-- TAB 4: Distribución por Variable -->
                <p-tabpanel value="3">
                    <section class="card" *ngIf="distribucion && distribucion.items.length">
                        <div class="cies-section-head">
                            <div>
                                <h3>{{ distribucion.etiquetaPregunta }}</h3>
                                <p>Variable: <code>{{ distribucion.codigoVariable }}</code></p>
                            </div>
                            <app-cies-info-hint text="Muestra cómo se repartieron las respuestas en una pregunta específica del instrumento."></app-cies-info-hint>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem;">
                            <div class="chart-container" style="min-height: 20rem;">
                                <p-chart type="pie" [data]="distributionChartData" [options]="pieChartOptions"></p-chart>
                            </div>
                            <div>
                                <p-table [value]="distribucion.items" [tableStyle]="{ 'min-width': '24rem' }"
                                    [paginator]="true" [rows]="5" [rowsPerPageOptions]="[5, 10, 20]" responsiveLayout="scroll"
                                    class="cies-table">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th>Respuesta</th>
                                            <th>Total</th>
                                            <th>%</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-item>
                                        <tr>
                                            <td>{{ item.etiqueta }}</td>
                                            <td><strong>{{ item.total | numeroFormato }}</strong></td>
                                            <td>{{ getPorcentaje(item.total, distribucion) }}%</td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </div>
                        </div>
                    </section>
                    <section class="card cies-empty-state" *ngIf="distribucion && !distribucion.items.length">
                        <i class="pi pi-chart-pie"></i>
                        <h3>Sin distribución para esta variable</h3>
                        <p>La variable seleccionada no tiene respuestas dentro de los filtros actuales.</p>
                    </section>
                </p-tabpanel>
            </p-tabpanels>
        </p-tabs>

            <!-- EMPTY STATE: Sin resultados -->
            <section *ngIf="resumen && !hasResults" class="card">
                <div class="cies-empty-state">
                    <div class="cies-empty-state__icon"><i class="pi pi-chart-bar"></i></div>
                    <h3>No hay resultados con esos filtros</h3>
                    <p>Prueba quitando filtros o usando la vista general.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Ver todo" icon="pi pi-refresh"
                            [disabled]="loading || downloading" (click)="resetFilters()"></button>
                    </div>
                </div>
            </section>

            <!-- EMPTY STATE: Sin datos cargadas -->
            <section *ngIf="!resumen && !loading" class="card">
                <div class="cies-empty-state">
                    <div class="cies-empty-state__icon"><i class="pi pi-chart-bar"></i></div>
                    <h3>Sin datos de reportería</h3>
                    <p>Se necesitan entrevistas finalizadas para generar indicadores.</p>
                </div>
            </section>
        </div>

        <p-toast></p-toast>
    `,
    styles: [`
        .card-stat--pobre {
            border-left: 4px solid #ef4444;
        }
        .card-stat--excluido {
            border-left: 4px solid #f59e0b;
        }
        .card-stat--subatendido {
            border-left: 4px solid #0ea5e9;
        }

        .stat-percent {
            font-size: 0.8rem;
            color: var(--text-color-secondary);
        }

        .progress-bars-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .progress-bar-item {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
        }

        .progress-bar-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
        }

        .progress-bar-label strong {
            margin-left: auto;
        }

        .dot {
            display: inline-block;
            width: 0.65rem;
            height: 0.65rem;
            border-radius: 50%;
        }

        .dot--pobre { background: #ef4444; }
        .dot--excluido { background: #f59e0b; }
        .dot--subatendido { background: #0ea5e9; }

        ::ng-deep .progress-bar--pobre .p-progressbar-value { background: #ef4444; }
        ::ng-deep .progress-bar--excluido .p-progressbar-value { background: #f59e0b; }
        ::ng-deep .progress-bar--subatendido .p-progressbar-value { background: #0ea5e9; }

        .cies-chart-card {
            min-height: 25rem;
        }

        .chart-container {
            padding: 1rem 0;
        }

        ::ng-deep .chart-container canvas {
            max-height: 22rem;
        }

        .cell-with-bar {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .mini-bar {
            width: 100%;
            height: 6px;
            background: var(--surface-ground);
            border-radius: 3px;
            overflow: hidden;
        }

        .mini-bar-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease;
        }

        .mini-bar--pobre { background: #ef4444; }
        .mini-bar--excluido { background: #f59e0b; }
        .mini-bar--subatendido { background: #0ea5e9; }

        .cies-filter-card {
            display: flex;
            flex-direction: column;
            gap: 1.15rem;
        }

        .cies-filter-card .cies-section-head {
            margin-bottom: 0;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .cies-filter-count {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            min-height: 2rem;
            padding: 0.35rem 0.7rem;
            border-radius: 999px;
            background: color-mix(in srgb, var(--primary-color) 10%, transparent);
            color: var(--primary-color);
            font-size: 0.78rem;
            font-weight: 700;
            white-space: nowrap;
        }

        .cies-filter-grid {
            display: grid;
            grid-template-columns: repeat(12, minmax(0, 1fr));
            gap: 1rem;
            align-items: end;
        }

        .cies-filter-field {
            grid-column: span 3;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }

        .cies-filter-field--short {
            grid-column: span 2;
        }

        .cies-filter-field--date {
            grid-column: span 3;
        }

        .cies-filter-field--wide {
            grid-column: span 4;
        }

        .cies-filter-field--variable {
            grid-column: span 5;
        }

        .cies-filter-field label {
            display: block;
            margin-bottom: 0.45rem;
            font-weight: 700;
            color: var(--cies-ink);
        }

        .cies-filter-actions {
            grid-column: span 3;
            display: flex;
            justify-content: flex-end;
            align-items: end;
            gap: 0.75rem;
            min-width: 0;
        }

        :host ::ng-deep .cies-filter-field .p-select,
        :host ::ng-deep .cies-filter-field .p-datepicker,
        :host ::ng-deep .cies-filter-field .p-inputtext {
            width: 100%;
        }

        :host ::ng-deep .cies-filter-field .p-select-label {
            min-width: 0;
        }

        @media (max-width: 1200px) {
            .cies-filter-field,
            .cies-filter-field--short,
            .cies-filter-field--date {
                grid-column: span 4;
            }

            .cies-filter-field--wide,
            .cies-filter-field--variable {
                grid-column: span 6;
            }

            .cies-filter-actions {
                grid-column: 1 / -1;
                justify-content: flex-start;
            }
        }

        @media (max-width: 768px) {
            .cies-stats-grid {
                grid-template-columns: 1fr;
            }

            .cies-filter-card .cies-section-head {
                align-items: stretch;
            }

            .cies-filter-count {
                width: fit-content;
            }

            .cies-filter-field,
            .cies-filter-field--short,
            .cies-filter-field--date,
            .cies-filter-field--wide,
            .cies-filter-field--variable,
            .cies-filter-actions {
                grid-column: 1 / -1;
            }

            .cies-filter-actions {
                flex-direction: column;
                align-items: stretch;
            }

            .cies-filter-actions button {
                width: 100%;
            }

            .chart-container {
                min-height: 18rem;
            }

            p-chart canvas {
                max-height: 18rem !important;
            }
        }
    `]
})
export class ReporteriaPage implements OnInit {
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);

    resumen: ReporteResumen | null = null;
    distribucion: DistribucionVariable | null = null;
    loading = false;
    downloading = false;

    versionOptions: Array<{ label: string; value: string }> = [{ label: 'Todas', value: '' }];
    regionalOptions: Array<{ label: string; value: string }> = [{ label: 'Todas', value: '' }];
    clinicaOptions: Array<{ label: string; value: string }> = [{ label: 'Todas', value: '' }];
    variableOptions: Array<{ label: string; value: string }> = [
        { label: 'Servicio', value: 'SERVICIO' },
        { label: 'Miembros del hogar', value: 'MIEMBROS_HOGAR' },
        { label: 'Jefe del hogar trabaja', value: 'JEFE_TRABAJO' },
        { label: 'Idioma niñez', value: 'IDIOMA_NIÑEZ' },
        { label: 'Cuartos', value: 'CUARTOS' },
        { label: 'Material del piso', value: 'MATERIAL_PISO' },
        { label: 'Tipo de baño', value: 'TIPO_BAÑO' },
        { label: 'Combustible', value: 'COMBUSTIBLE' },
        { label: 'Refrigerador', value: 'REFRIGERADOR' },
        { label: 'Televisor', value: 'TELEVISOR' },
        { label: 'Vehículo', value: 'VEHICULO' },
        { label: 'Idioma hogar', value: 'IDIOMA_HOGAR' },
        { label: 'No castellano', value: 'NO_CASTELLANO' },
        { label: 'Educación', value: 'EDUCACION' },
        { label: 'Método anticonceptivo', value: 'METODO_AC' },
        { label: 'Computadora', value: 'COMPUTADORA' },
        { label: 'Celular', value: 'CELULAR' },
        { label: 'Lugar parto', value: 'LUGAR_PARTO' },
        { label: 'Zona residencia', value: 'ZONA_RESIDENCIA' },
        { label: 'Acceso salud', value: 'ACCESO_SALUD' }
    ];

    classificationChartData: any = null;
    tendenciasChartData: any = null;
    clinicasChartData: any = null;
    distributionChartData: any = null;

    doughnutOptions = {
        cutout: '60%',
        plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
        },
        maintainAspectRatio: false
    };

    pieChartOptions = {
        plugins: {
            legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 } } }
        },
        maintainAspectRatio: false
    };

    barChartOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
        scales: {
            x: { stacked: false, grid: { display: false } },
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
    };

    horizontalChartOptions = {
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
        scales: { x: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } }, y: { grid: { display: false } } }
    };

    filters: ReportFilters = {
        anio: '',
        fechaDesde: null,
        fechaHasta: null,
        regional: '',
        clinica: '',
        version: '',
        clasificacion: '',
        codigoVariable: 'SERVICIO'
    };

    clasificaciones = [
        { label: 'Todas', value: '' },
        { label: 'Vulnerable', value: 'POBRE' },
        { label: 'Excluida', value: 'EXCLUIDA' },
        { label: 'Subatendida', value: 'SUBATENDIDA' }
    ];

    ngOnInit(): void {
        this.ciesService.listMetodologias().subscribe({
            next: (response: Metodologia[]) => {
                this.versionOptions = [
                    { label: 'Todas', value: '' },
                    ...response.map((item) => ({
                        label: item.nombre + (item.activa ? ' (Activa)' : ''),
                        value: item.nombre
                    }))
                ];
                this.syncVariableOptions(response);
                this.cdr.detectChanges();
                this.load();
            },
            error: (err) => {
                console.error('Error loading metodologías:', err);
                this.load();
            }
        });
    }

    private syncVariableOptions(metodologias: Metodologia[]): boolean {
        const activa = metodologias.find((item) => item.activa) || metodologias[0];
        if (!activa?.preguntas?.length) {
            return false;
        }

        const previousVariable = this.filters.codigoVariable;
        const variables = new Map<string, string>();
        activa.preguntas
            .filter((pregunta) => pregunta.codigoVariable)
            .sort((a, b) => a.orden - b.orden)
            .forEach((pregunta) => {
                if (!variables.has(pregunta.codigoVariable)) {
                    variables.set(pregunta.codigoVariable, pregunta.etiqueta || pregunta.codigoVariable);
                }
            });

        this.variableOptions = Array.from(variables.entries()).map(([value, label]) => ({ label, value }));
        if (!this.variableOptions.some((option) => option.value === this.filters.codigoVariable)) {
            this.filters.codigoVariable = this.variableOptions[0]?.value || 'SERVICIO';
        }
        return this.filters.codigoVariable !== previousVariable;
    }

    get hasResults(): boolean {
        return (this.resumen?.totalEntrevistas || 0) > 0;
    }

    get activeFilterCount(): number {
        let count = 0;
        if (this.filters.anio.trim()) count++;
        if (this.filters.fechaDesde) count++;
        if (this.filters.fechaHasta) count++;
        if (this.filters.regional) count++;
        if (this.filters.clinica) count++;
        if (this.filters.version) count++;
        if (this.filters.clasificacion) count++;
        if (this.filters.codigoVariable && this.filters.codigoVariable !== 'SERVICIO') count++;
        return count;
    }

    load(): void {
        if (this.loading) {
            return;
        }
        if (!this.validateFilters()) {
            return;
        }
        this.loading = true;
        const filters = this.getFilterPayload();

        forkJoin({
            resumen: this.ciesService.getReporteResumen(filters),
            distribucion: this.ciesService.getDistribucionVariable(filters)
        }).subscribe({
            next: ({ resumen, distribucion }) => {
                this.resumen = resumen;
                this.distribucion = distribucion;
                this.buildCharts();
                this.loadFilterOptions();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loading = false;
                console.error('Error loading reportes:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los reportes' });
            }
        });

    }

    loadFilterOptions(): void {
        if (this.resumen?.comparativoClinicas) {
            const clinicas = Array.from(new Set(this.resumen.comparativoClinicas.map((c) => c.clinica))).filter(Boolean);
            this.clinicaOptions = this.mergeFilterOptions(this.clinicaOptions, clinicas, this.filters.clinica);
            const regionales = Array.from(new Set(this.resumen.comparativoClinicas.map((c) => c.regional || ''))).filter(Boolean);
            this.regionalOptions = this.mergeFilterOptions(this.regionalOptions, regionales, this.filters.regional);
            return;
        }

        this.regionalOptions = [{ label: 'Todas', value: '' }];
        this.clinicaOptions = [{ label: 'Todas', value: '' }];
    }

    resetFilters(): void {
        if (this.loading || this.downloading) {
            return;
        }
        this.filters = {
            anio: '',
            fechaDesde: null,
            fechaHasta: null,
            regional: '',
            clinica: '',
            version: '',
            clasificacion: '',
            codigoVariable: 'SERVICIO'
        };
        this.regionalOptions = [{ label: 'Todas', value: '' }];
        this.clinicaOptions = [{ label: 'Todas', value: '' }];
        this.load();
    }

    download(type: 'excel' | 'csv' | 'sps'): void {
        if (this.loading || this.downloading) {
            return;
        }
        if (!this.validateFilters()) {
            return;
        }
        this.downloading = true;
        const filters = this.getFilterPayload();
        const request$ =
            type === 'excel' ? this.ciesService.exportExcel(filters)
                : type === 'csv' ? this.ciesService.exportCsv(filters)
                : this.ciesService.exportSps(filters);

        request$.subscribe({
            next: (blob) => {
                this.downloading = false;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `reporte-cies.${type === 'excel' ? 'xlsx' : type === 'sps' ? 'sps' : 'csv'}`;
                link.click();
                URL.revokeObjectURL(url);
            },
            error: (err) => {
                this.downloading = false;
                console.error('Error downloading report:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el reporte' });
            }
        });
    }

    getPorcentaje(total: number, dist: DistribucionVariable): number {
        const sum = dist.items.reduce((acc, item) => acc + item.total, 0);
        if (!sum) return 0;
        return Math.round((total / sum) * 100);
    }

    private buildCharts(): void {
        if (this.resumen) {
            this.classificationChartData = {
                labels: ['Vulnerables', 'Excluidas', 'Subatendidas'],
                datasets: [{
                    data: [this.resumen.totalPobres, this.resumen.totalExcluidas, this.resumen.totalSubatendidas],
                    backgroundColor: ['#ef4444', '#f59e0b', '#0ea5e9'],
                    hoverOffset: 8
                }]
            };

            this.tendenciasChartData = {
                labels: this.resumen.tendencias.map((item) => item.etiqueta),
                datasets: [
                    { label: 'Total', data: this.resumen.tendencias.map((i) => i.total), backgroundColor: '#6366f1', borderRadius: 4 },
                    { label: 'Vulnerables', data: this.resumen.tendencias.map((i) => i.pobres), backgroundColor: '#ef4444', borderRadius: 4 },
                    { label: 'Excluidas', data: this.resumen.tendencias.map((i) => i.excluidas), backgroundColor: '#f59e0b', borderRadius: 4 },
                    { label: 'Subatendidas', data: this.resumen.tendencias.map((i) => i.subatendidas), backgroundColor: '#0ea5e9', borderRadius: 4 }
                ]
            };

            this.clinicasChartData = {
                labels: this.resumen.comparativoClinicas.map((item) => item.clinica),
                datasets: [
                    { label: '% Vulnerables', data: this.resumen.comparativoClinicas.map((i) => i.porcentajePobres), backgroundColor: '#ef4444', borderRadius: 4 },
                    { label: '% Excluidas', data: this.resumen.comparativoClinicas.map((i) => i.porcentajeExcluidas), backgroundColor: '#f59e0b', borderRadius: 4 },
                    { label: '% Subatendidas', data: this.resumen.comparativoClinicas.map((i) => i.porcentajeSubatendidas), backgroundColor: '#0ea5e9', borderRadius: 4 }
                ]
            };
        }

        if (this.distribucion) {
            const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#f97316'];
            this.distributionChartData = {
                labels: this.distribucion.items.map((item) => item.etiqueta),
                datasets: [{
                    data: this.distribucion.items.map((item) => item.total),
                    backgroundColor: colors.slice(0, this.distribucion.items.length),
                    hoverOffset: 6
                }]
            };
        }
    }

    private validateFilters(): boolean {
        const anio = this.filters.anio.trim();
        if (anio && !/^\d{4}$/.test(anio)) {
            this.messageService.add({ severity: 'warn', summary: 'Filtro inválido', detail: 'El año debe tener 4 dígitos, por ejemplo 2026.' });
            return false;
        }
        if (this.filters.fechaDesde && this.filters.fechaHasta && this.filters.fechaDesde > this.filters.fechaHasta) {
            this.messageService.add({ severity: 'warn', summary: 'Filtro inválido', detail: 'La fecha desde no puede ser posterior a la fecha hasta.' });
            return false;
        }
        return true;
    }

    private mergeFilterOptions(currentOptions: SelectOption[], values: string[], selectedValue: string): SelectOption[] {
        const merged = new Set<string>();
        currentOptions
            .map((option) => option.value)
            .filter(Boolean)
            .forEach((value) => merged.add(value));
        values.filter(Boolean).forEach((value) => merged.add(value));
        if (selectedValue) {
            merged.add(selectedValue);
        }
        return [
            { label: 'Todas', value: '' },
            ...Array.from(merged)
                .sort((a, b) => a.localeCompare(b))
                .map((value) => ({ label: value, value }))
        ];
    }

    private formatDateParam(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private getFilterPayload(): Record<string, string> {
        return {
            anio: this.filters.anio.trim(),
            fechaDesde: this.filters.fechaDesde ? this.formatDateParam(this.filters.fechaDesde) : '',
            fechaHasta: this.filters.fechaHasta ? this.formatDateParam(this.filters.fechaHasta) : '',
            regional: this.filters.regional,
            clinica: this.filters.clinica,
            version: this.filters.version,
            clasificacion: this.filters.clasificacion,
            codigoVariable: this.filters.codigoVariable
        };
    }
}

