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
                        severity="secondary" [outlined]="true" (click)="resetFilters()"></button>
                    <button pButton type="button" label="Excel" icon="pi pi-file-excel"
                        severity="success" [loading]="downloading" (click)="download('excel')"></button>
                    <button pButton type="button" label="CSV" icon="pi pi-download"
                        severity="secondary" [loading]="downloading" (click)="download('csv')"></button>
                    <button pButton type="button" label="SPSS" icon="pi pi-database"
                        severity="contrast" [loading]="downloading" (click)="download('sps')"></button>
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
                    <div class="cies-guidance-actions">
                        <button pButton type="button" label="Ver todo" size="small"
                            (click)="resetFilters()"></button>
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
            <section class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Filtros de análisis</h3>
                            <p>Acota la reportería por tiempo, sede, versión metodológica, clasificación y variable.</p>
                        </div>
                        <app-cies-info-hint text="Los filtros afectan los indicadores, gráficos, comparativos y archivos exportados."></app-cies-info-hint>
                    </div>
                </div>
                <div class="cies-form-grid cies-form-grid--filters">
                    <div>
                        <label>Año</label>
                        <input pInputText [(ngModel)]="filters.anio" class="w-full" placeholder="Ej: 2026" />
                    </div>
                    <div>
                        <label>Regional</label>
                        <p-select [options]="regionalOptions" [(ngModel)]="filters.regional"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas"></p-select>
                    </div>
                    <div>
                        <label>Clínica</label>
                        <p-select [options]="clinicaOptions" [(ngModel)]="filters.clinica"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas"></p-select>
                    </div>
                    <div>
                        <label>Versión metodológica</label>
                        <p-select [options]="versionOptions" [(ngModel)]="filters.version"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas"></p-select>
                    </div>
                    <div>
                        <label>Clasificación</label>
                        <p-select [options]="clasificaciones" [(ngModel)]="filters.clasificacion"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas"></p-select>
                    </div>
                    <div>
                        <label>Variable</label>
                        <p-select [options]="variableOptions" [(ngModel)]="filters.codigoVariable"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Selecciona una variable"></p-select>
                    </div>
                    <div class="cies-actions-row">
                        <button pButton type="button" label="Aplicar filtros" icon="pi pi-filter"
                            [loading]="loading" (click)="load()"></button>
                        <button pButton type="button" label="Limpiar" severity="secondary"
                            [outlined]="true" icon="pi pi-times" (click)="resetFilters()"></button>
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
                    <section class="card cies-chart-card">
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
                </p-tabpanel>

                <!-- TAB 3: Comparativo por Clínica -->
                <p-tabpanel value="2">
                    <section class="card cies-chart-card">
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
                    <section class="card" style="margin-top: 1rem;">
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
                </p-tabpanel>

                <!-- TAB 4: Distribución por Variable -->
                <p-tabpanel value="3">
                    <section class="card" *ngIf="distribucion">
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
                            (click)="resetFilters()"></button>
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

        @media (max-width: 768px) {
            .cies-stats-grid {
                grid-template-columns: 1fr;
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
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading metodologías:', err)
        });
        this.load();
    }

    get hasResults(): boolean {
        return (this.resumen?.totalEntrevistas || 0) > 0;
    }

    get activeFilterCount(): number {
        let count = 0;
        if (this.filters.fechaDesde) count++;
        if (this.filters.fechaHasta) count++;
        if (this.filters.regional) count++;
        if (this.filters.clinica) count++;
        if (this.filters.version) count++;
        if (this.filters.clasificacion) count++;
        return count;
    }

    load(): void {
        this.loading = true;
        const filters = this.getFilterPayload();

        this.ciesService.getReporteResumen(filters).subscribe({
            next: (response) => {
                this.resumen = response;
                this.buildCharts();
                this.loadFilterOptions();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loading = false;
                console.error('Error loading resumen:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los reportes' });
            }
        });

        this.ciesService.getDistribucionVariable(filters).subscribe({
            next: (response) => {
                this.distribucion = response;
                this.buildCharts();
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading distribución:', err)
        });
    }

    loadFilterOptions(): void {
        if (this.resumen?.comparativoClinicas) {
            const clinicas = Array.from(new Set(this.resumen.comparativoClinicas.map((c) => c.clinica))).sort();
            this.clinicaOptions = [
                { label: 'Todas', value: '' },
                ...clinicas.map((c) => ({ label: c, value: c }))
            ];
            const regionales = Array.from(new Set(this.resumen.comparativoClinicas.map((c) => c.regional || ''))).filter(Boolean).sort();
            this.regionalOptions = [
                { label: 'Todas', value: '' },
                ...regionales.map((r) => ({ label: r, value: r }))
            ];
            return;
        }

        this.regionalOptions = [{ label: 'Todas', value: '' }];
        this.clinicaOptions = [{ label: 'Todas', value: '' }];
    }

    resetFilters(): void {
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

    private getFilterPayload(): Record<string, string> {
        return {
            anio: this.filters.anio,
            fechaDesde: this.filters.fechaDesde ? this.filters.fechaDesde.toISOString().split('T')[0] : '',
            fechaHasta: this.filters.fechaHasta ? this.filters.fechaHasta.toISOString().split('T')[0] : '',
            regional: this.filters.regional,
            clinica: this.filters.clinica,
            version: this.filters.version,
            clasificacion: this.filters.clasificacion,
            codigoVariable: this.filters.codigoVariable
        };
    }
}

