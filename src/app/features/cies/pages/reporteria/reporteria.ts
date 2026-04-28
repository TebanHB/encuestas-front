import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
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
import { CiesService, DistribucionVariable, Metodologia, ReporteExcelGraficos, ReporteResumen } from '../../services/cies.service';

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
        CommonModule, FormsModule, ButtonModule, ChartModule, CheckboxModule, DialogModule, InputTextModule, SelectModule,
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
                    <button pButton type="button" label="Excel" icon="pi pi-file-excel"
                        severity="success" [loading]="downloading" [disabled]="loading || downloading || !resumen" (click)="openExportDialog()"></button>
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

            <section *ngIf="loading" class="card cies-loading-state">
                <div>
                    <strong>Cargando datos</strong>
                    <span>Estamos preparando indicadores, tablas y gráficos.</span>
                </div>
                <p-progressBar mode="indeterminate" [style]="{ height: '6px' }"></p-progressBar>
            </section>

            <!-- TABS DE REPORTERÍA -->
            <p-tabs [(value)]="activeTab" [style]="{ marginTop: '1.5rem' }" [hidden]="!resumen || !hasResults || loading">
                <p-tablist>
                    <p-tab value="0">Resumen General</p-tab>
                    <p-tab value="1">Tendencias</p-tab>
                    <p-tab value="2">Comparativo por Clínica</p-tab>
                    <p-tab value="3">Distribución por Variable</p-tab>
                    <p-tab value="4">Gráficos</p-tab>
                </p-tablist>
                <ng-container *ngIf="resumen">
                <p-tabpanels>

                <!-- TAB 1: Resumen General -->
                <p-tabpanel value="0">
                    <section class="card cies-summary-panel">
                        <div class="cies-summary-panel__main">
                            <div class="cies-card-caption">
                                <span>Resumen general</span>
                                <app-cies-info-hint text="El total incluye entrevistas finalizadas con y sin vulnerabilidad."></app-cies-info-hint>
                            </div>
                            <strong>{{ resumen.totalEntrevistas | numeroFormato }}</strong>
                            <p>
                                entrevistas finalizadas. El total no se calcula sumando pobreza, exclusión y subatención;
                                esas son categorías del subconjunto con vulnerabilidad.
                            </p>
                        </div>
                        <div class="cies-summary-panel__split">
                            <article>
                                <span>Con vulnerabilidad</span>
                                <strong>{{ resumen.totalConVulnerabilidad | numeroFormato }}</strong>
                                <small>{{ resumen.porcentajeConVulnerabilidad }}%</small>
                            </article>
                            <article>
                                <span>Sin vulnerabilidad</span>
                                <strong>{{ resumen.totalSinVulnerabilidad | numeroFormato }}</strong>
                                <small>{{ resumen.porcentajeSinVulnerabilidad }}%</small>
                            </article>
                        </div>
                    </section>

                    <section class="cies-summary-detail-grid">
                        <article class="card cies-factor-card" title="Entrevistas que no cumplen ninguna de las tres condiciones (Pobre, Excluida, Subatendida)">
                            <span>Sin condiciones</span>
                            <strong>{{ resumen.totalSinVulnerabilidad | numeroFormato }}</strong>
                        </article>
                        <article class="card cies-factor-card" title="Entrevistas que cumplen exactamente una de las tres condiciones de vulnerabilidad">
                            <span>1 condición</span>
                            <strong>{{ resumen.totalUnFactor | numeroFormato }}</strong>
                        </article>
                        <article class="card cies-factor-card" title="Entrevistas que cumplen dos condiciones de vulnerabilidad simultáneamente">
                            <span>2 condiciones</span>
                            <strong>{{ resumen.totalDosFactores | numeroFormato }}</strong>
                        </article>
                        <article class="card cies-factor-card" title="Entrevistas que cumplen las tres condiciones (Pobre + Excluida + Subatendida)">
                            <span>3 condiciones</span>
                            <strong>{{ resumen.totalTresFactores | numeroFormato }}</strong>
                        </article>
                    </section>

                    <section class="cies-summary-detail-grid cies-summary-detail-grid--three">
                        <article class="card cies-category-card cies-category-card--pobre">
                            <span>Pobreza</span>
                            <strong>{{ resumen.totalPobres | numeroFormato }}</strong>
                            <small>{{ resumen.porcentajePobres }}%</small>
                        </article>
                        <article class="card cies-category-card cies-category-card--excluido">
                            <span>Excluidas</span>
                            <strong>{{ resumen.totalExcluidas | numeroFormato }}</strong>
                            <small>{{ resumen.porcentajeExcluidas }}%</small>
                        </article>
                        <article class="card cies-category-card cies-category-card--subatendido">
                            <span>Subatendidas</span>
                            <strong>{{ resumen.totalSubatendidas | numeroFormato }}</strong>
                            <small>{{ resumen.porcentajeSubatendidas }}%</small>
                        </article>
                    </section>

                    <!-- Barras de progreso -->
                    <section class="card" style="margin-top: 1rem;">
                        <h4 style="margin: 0 0 1rem; font-size: 0.95rem;">Distribución porcentual</h4>
                        <div class="progress-bars-container">
                            <div class="progress-bar-item">
                                <div class="progress-bar-label">
                                    <span class="dot dot--pobre"></span>
                                    <span>Pobreza</span>
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
                                    <th>Pobreza</th>
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
                                <p>
                                    Porcentaje de entrevistas clasificadas como
                                    <strong style="color:#ef4444">Pobre</strong>,
                                    <strong style="color:#f59e0b">Excluida</strong> y
                                    <strong style="color:#0ea5e9">Subatendida</strong>
                                    en cada clínica. Las barras se calculan sobre las entrevistas finalizadas de esa clínica;
                                    una misma entrevista puede aparecer en más de una barra cuando cumple varias condiciones.
                                </p>
                            </div>
                            <app-cies-info-hint text="Las clínicas se ordenan por porcentaje de pobreza descendente. Pasa el mouse por cada barra para ver los valores absolutos y porcentuales."></app-cies-info-hint>
                        </div>
                        <div class="chart-container" [style.min-height.px]="comparativoChartHeight">
                            <p-chart type="bar" [data]="clinicasChartData" [options]="horizontalChartOptions"></p-chart>
                        </div>
                        <div class="cies-chart-legend">
                            <span class="legend-pill"><span class="dot dot--pobre"></span>Pobre = puntaje normalizado &ge; umbral de pobreza</span>
                            <span class="legend-pill"><span class="dot dot--excluido"></span>Excluida = puntaje &ge; umbral de exclusión</span>
                            <span class="legend-pill"><span class="dot dot--subatendido"></span>Subatendida = puntaje &ge; umbral de subatención</span>
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
                                    <th pSortableColumn="porcentajePobres">% Pobreza <p-sortIcon field="porcentajePobres"></p-sortIcon></th>
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

                        <div class="distribution-layout">
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

                <!-- TAB 5: Gráficos del Excel de referencia -->
                <p-tabpanel value="4">
                    <section class="excel-charts-grid" *ngIf="graficosExcel">
                        <article class="card cies-chart-card">
                            <div class="cies-section-head">
                                <div>
                                    <h3>Distribución por número de condiciones de vulnerabilidad</h3>
                                    <p>Cuántas entrevistas tienen 0, 1, 2 o 3 condiciones (Pobre, Excluida, Subatendida) acumuladas.</p>
                                </div>
                            </div>
                            <div class="chart-container">
                                <p-chart type="doughnut" [data]="excelFactoresChartData" [options]="doughnutOptions"></p-chart>
                            </div>
                        </article>

                        <article class="card cies-chart-card">
                            <div class="cies-section-head">
                                <div>
                                    <h3>% de usuarias pobres y no pobres</h3>
                                    <p>Distribución de vulnerabilidad pobre frente al resto de entrevistas.</p>
                                </div>
                            </div>
                            <div class="chart-container">
                                <p-chart type="pie" [data]="excelPobreChartData" [options]="pieChartOptions"></p-chart>
                            </div>
                        </article>

                        <article class="card cies-chart-card cies-chart-card--wide">
                            <div class="cies-section-head">
                                <div>
                                    <h3>% usuarios que presentan pobreza moderada por regional</h3>
                                    <p>Pobreza moderada por regional.</p>
                                </div>
                            </div>
                            <div class="chart-container">
                                <p-chart type="bar" [data]="excelPobrezaRegionalChartData" [options]="percentByRegionalChartOptions"></p-chart>
                            </div>
                        </article>

                        <article class="card cies-chart-card cies-chart-card--wide">
                            <div class="cies-section-head">
                                <div>
                                    <h3>% de usuarias excluidas</h3>
                                    <p>Exclusión por regional.</p>
                                </div>
                            </div>
                            <div class="chart-container">
                                <p-chart type="bar" [data]="excelExclusionRegionalChartData" [options]="percentByRegionalChartOptions"></p-chart>
                            </div>
                        </article>

                        <article class="card cies-chart-card cies-chart-card--wide">
                            <div class="cies-section-head">
                                <div>
                                    <h3>% de usuarias sub-atendidas</h3>
                                    <p>Sub-atención por regional.</p>
                                </div>
                            </div>
                            <div class="chart-container">
                                <p-chart type="bar" [data]="excelSubatencionRegionalChartData" [options]="percentByRegionalChartOptions"></p-chart>
                            </div>
                        </article>

                        <article class="card cies-chart-card cies-chart-card--wide">
                            <div class="cies-section-head">
                                <div>
                                    <h3>% de vulnerabilidad por regional (las 3 condiciones)</h3>
                                    <p>Para cada regional muestra el porcentaje de entrevistas clasificadas como Pobre, Excluida y Subatendida.</p>
                                </div>
                            </div>
                            <div class="chart-container">
                                <p-chart type="bar" [data]="excelRegionalChartData" [options]="barChartOptions"></p-chart>
                            </div>
                        </article>

                        <article class="card cies-chart-card cies-chart-card--wide">
                            <div class="cies-section-head">
                                <div>
                                    <h3>Combinaciones de condiciones por regional</h3>
                                    <p>Porcentaje de entrevistas que cumplen pares de condiciones simultáneamente: Pobre+Excluida, Pobre+Subatendida y Excluida+Subatendida.</p>
                                </div>
                            </div>
                            <div class="chart-container">
                                <p-chart type="bar" [data]="excelCombinacionesChartData" [options]="associatedChartOptions"></p-chart>
                            </div>
                            <div class="associated-summary" *ngIf="associatedSummary.length">
                                <span *ngFor="let item of associatedSummary">
                                    <strong>{{ item.total | numeroFormato }}</strong>
                                    {{ item.label }}
                                </span>
                            </div>
                        </article>
                    </section>

                    <section class="card excel-frequency-panel" *ngIf="frequencyPreviewCharts.length">
                        <div class="cies-section-head">
                            <div>
                                <h3>Frecuencias generales</h3>
                                <p>Gráficos de categorías que aparecen en la hoja Frecuencias Generales.</p>
                            </div>
                        </div>
                        <div class="excel-frequency-grid">
                            <article class="excel-mini-chart" *ngFor="let chart of frequencyPreviewCharts">
                                <h4>{{ chart.title }}</h4>
                                <div class="excel-mini-chart__body" [style.height.px]="chart.height">
                                    <p-chart type="bar" [data]="chart.data" [options]="frequencyChartOptions"></p-chart>
                                </div>
                            </article>
                        </div>
                    </section>
                </p-tabpanel>
            </p-tabpanels>
                </ng-container>
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

        <p-dialog [(visible)]="excelDialogVisible" [modal]="true" [draggable]="false" [resizable]="false"
            [style]="{ width: '68rem', 'max-width': '96vw', 'max-height': '92vh' }"
            [contentStyle]="{ overflow: 'auto', 'max-height': 'calc(92vh - 9.5rem)' }"
            header="Exportar Excel CIES" styleClass="cies-dialog cies-export-dialog">
            <div class="excel-export-layout">
                <section class="excel-export-block">
                    <h4>Contenido</h4>
                    <label class="excel-check">
                        <p-checkbox [(ngModel)]="excelSections.presentacion" [binary]="true" inputId="excel-presentacion"></p-checkbox>
                        Presentación y resumen
                    </label>
                    <label class="excel-check">
                        <p-checkbox [(ngModel)]="excelSections.datos" [binary]="true" inputId="excel-datos"></p-checkbox>
                        Datos estilo base CIES
                    </label>
                    <label class="excel-check">
                        <p-checkbox [(ngModel)]="excelSections.calculos" [binary]="true" inputId="excel-calculos"></p-checkbox>
                        Hojas de cálculo por dimensión (Pobre / Excluida / Subatendida)
                    </label>
                    <label class="excel-check">
                        <p-checkbox [(ngModel)]="excelSections.frecuencias" [binary]="true" inputId="excel-frecuencias"></p-checkbox>
                        Frecuencias generales con gráficos
                    </label>
                    <label class="excel-check">
                        <p-checkbox [(ngModel)]="excelSections.vulnerabilidad" [binary]="true" inputId="excel-vulnerabilidad"></p-checkbox>
                        Vulnerabilidad, porcentajes y combinaciones
                    </label>
                </section>

                <section class="excel-export-block excel-export-block--filters">
                    <h4>Filtros de exportación</h4>
                    <div class="excel-export-grid">
                        <div class="cies-filter-field cies-filter-field--short">
                            <label>Año</label>
                            <input pInputText [(ngModel)]="exportFilters.anio" class="w-full" placeholder="Ej: 2026"
                                inputmode="numeric" maxlength="4" />
                        </div>
                        <div class="cies-filter-field">
                            <label>Fecha desde</label>
                            <p-datepicker [(ngModel)]="exportFilters.fechaDesde" dateFormat="yy-mm-dd"
                                appendTo="body" class="w-full" [showIcon]="true" placeholder="Desde"></p-datepicker>
                        </div>
                        <div class="cies-filter-field">
                            <label>Fecha hasta</label>
                            <p-datepicker [(ngModel)]="exportFilters.fechaHasta" dateFormat="yy-mm-dd"
                                appendTo="body" class="w-full" [showIcon]="true" placeholder="Hasta"></p-datepicker>
                        </div>
                        <div class="cies-filter-field">
                            <label>Regional</label>
                            <p-select [options]="regionalOptions" [(ngModel)]="exportFilters.regional"
                                optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                placeholder="Todas"></p-select>
                        </div>
                        <div class="cies-filter-field">
                            <label>Clínica</label>
                            <p-select [options]="clinicaOptions" [(ngModel)]="exportFilters.clinica"
                                optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                placeholder="Todas"></p-select>
                        </div>
                        <div class="cies-filter-field">
                            <label>Versión</label>
                            <p-select [options]="versionOptions" [(ngModel)]="exportFilters.version"
                                optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                placeholder="Todas"></p-select>
                        </div>
                        <div class="cies-filter-field">
                            <label>Clasificación</label>
                            <p-select [options]="clasificaciones" [(ngModel)]="exportFilters.clasificacion"
                                optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                placeholder="Todas"></p-select>
                        </div>
                        <div class="cies-filter-field cies-filter-field--wide">
                            <label>Variable</label>
                            <p-select [options]="variableOptions" [(ngModel)]="exportFilters.codigoVariable"
                                optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                placeholder="Selecciona una variable"></p-select>
                        </div>
                    </div>
                </section>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true"
                    [disabled]="downloading" (click)="excelDialogVisible = false"></button>
                <button pButton type="button" label="Exportar Excel filtrado" icon="pi pi-file-excel"
                    [loading]="downloading" [disabled]="downloading" (click)="downloadExcelFromDialog(false)"></button>
                <button pButton type="button" label="Exportar todos los datos" icon="pi pi-database"
                    severity="success" [loading]="downloading" [disabled]="downloading" (click)="downloadExcelFromDialog(true)"></button>
            </ng-template>
        </p-dialog>

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

        .cies-summary-panel {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.55fr);
            gap: 1rem;
            align-items: stretch;
            overflow: hidden;
            position: relative;
            border-color: var(--layout-accent-soft-strong);
        }

        .cies-summary-panel::before {
            content: '';
            position: absolute;
            inset: 0 auto 0 0;
            width: 0.35rem;
            background: var(--primary-color);
        }

        .cies-summary-panel__main,
        .cies-summary-panel__split article,
        .cies-factor-card,
        .cies-category-card {
            border-radius: 8px;
        }

        .cies-summary-panel__main {
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
            padding-left: 0.35rem;
        }

        .cies-summary-panel__main > strong {
            font-size: clamp(3rem, 7vw, 4.75rem);
            line-height: 0.92;
            color: var(--layout-accent);
        }

        .cies-summary-panel__main p {
            max-width: 52rem;
            margin: 0;
            color: var(--text-color-secondary);
            line-height: 1.55;
        }

        .cies-summary-panel__split {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.75rem;
        }

        .cies-summary-panel__split article {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 0.25rem 0.75rem;
            align-items: end;
            padding: 1rem;
            background: var(--layout-panel-muted-background);
            border: 1px solid var(--layout-border-soft);
        }

        .cies-summary-panel__split span,
        .cies-factor-card span,
        .cies-category-card span {
            color: var(--text-color-secondary);
            font-weight: 700;
        }

        .cies-summary-panel__split strong {
            grid-row: span 2;
            font-size: 2rem;
            color: var(--layout-text-strong);
        }

        .cies-summary-panel__split small,
        .cies-category-card small {
            color: var(--text-color-secondary);
            font-weight: 700;
        }

        .cies-summary-detail-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.85rem;
            margin-top: 1rem;
        }

        .cies-summary-detail-grid--three {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .cies-factor-card,
        .cies-category-card {
            display: grid;
            gap: 0.35rem;
            padding: 1rem;
            min-height: 7rem;
        }

        .cies-factor-card {
            background: var(--layout-panel-muted-background);
        }

        .cies-factor-card strong,
        .cies-category-card strong {
            font-size: 2rem;
            line-height: 1;
            color: var(--layout-text-strong);
        }

        .cies-category-card--pobre {
            border-left: 4px solid #ef4444;
        }

        .cies-category-card--pobre strong {
            color: #ef4444;
        }

        .cies-category-card--excluido {
            border-left: 4px solid #f59e0b;
        }

        .cies-category-card--excluido strong {
            color: #f59e0b;
        }

        .cies-category-card--subatendido {
            border-left: 4px solid #0ea5e9;
        }

        .cies-category-card--subatendido strong {
            color: #0ea5e9;
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

        .cies-chart-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem 0.85rem;
            padding: 0.75rem 0 0;
            font-size: 0.78rem;
            color: var(--text-color-secondary);
            border-top: 1px dashed rgba(0,0,0,0.08);
            margin-top: 0.85rem;
        }

        .legend-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(0,0,0,0.025);
            border-radius: 999px;
            padding: 0.18rem 0.65rem;
        }

        .cies-chart-card {
            min-height: 25rem;
        }

        .cies-loading-state {
            margin-top: 1rem;
            display: grid;
            gap: 0.85rem;
        }

        .cies-loading-state div {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }

        .cies-loading-state strong {
            font-size: 1rem;
        }

        .cies-loading-state span {
            color: var(--text-color-secondary);
            font-size: 0.9rem;
        }

        .chart-container {
            padding: 1rem 0;
            min-height: 21rem;
        }

        .distribution-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 1.5rem;
            margin-top: 1rem;
        }

        .excel-charts-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
        }

        .cies-chart-card--wide {
            grid-column: 1 / -1;
        }

        .excel-frequency-panel {
            margin-top: 1rem;
        }

        .associated-summary {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.75rem;
            margin-top: 0.25rem;
        }

        .associated-summary span {
            min-width: 0;
            border: 1px solid var(--surface-border);
            border-radius: 8px;
            padding: 0.7rem;
            background: var(--surface-card);
            color: var(--text-color-secondary);
            font-size: 0.85rem;
        }

        .associated-summary strong {
            display: block;
            color: var(--text-color);
            font-size: 1.15rem;
            line-height: 1.1;
        }

        .excel-frequency-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
            align-items: start;
        }

        .excel-mini-chart {
            min-width: 0;
            display: flex;
            flex-direction: column;
            padding: 0.85rem;
            border: 1px solid var(--surface-border);
            border-radius: 8px;
            background: var(--surface-card);
        }

        .excel-mini-chart h4 {
            margin: 0 0 0.65rem;
            font-size: 0.9rem;
            line-height: 1.25;
        }

        .excel-mini-chart__body {
            min-height: 10.5rem;
            max-height: 20rem;
        }

        .excel-mini-chart__body p-chart,
        :host ::ng-deep .excel-mini-chart__body .p-chart,
        :host ::ng-deep .excel-mini-chart__body canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
        }

        .excel-export-layout {
            display: grid;
            grid-template-columns: minmax(15rem, 0.8fr) minmax(0, 1.4fr);
            gap: 1.25rem;
            align-items: start;
        }

        .excel-export-block {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
            overflow: hidden;
        }

        .excel-export-block h4 {
            margin: 0;
            font-size: 0.95rem;
        }

        .excel-check {
            display: flex;
            align-items: flex-start;
            gap: 0.65rem;
            min-height: 2rem;
            font-weight: 600;
            line-height: 1.25;
            overflow-wrap: anywhere;
        }

        .excel-export-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(13rem, 1fr));
            gap: 0.85rem;
        }

        :host ::ng-deep .cies-export-dialog .p-dialog-content {
            overscroll-behavior: contain;
        }

        :host ::ng-deep .cies-export-dialog .p-dialog-footer {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 0.75rem;
            padding-top: 0.85rem;
            border-top: 1px solid var(--surface-border);
        }

        :host ::ng-deep .cies-export-dialog .p-dialog-footer button {
            max-width: 100%;
            white-space: normal;
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
            max-width: 100%;
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

            .distribution-layout {
                grid-template-columns: 1fr;
                gap: 1rem;
            }

            .excel-charts-grid,
            .excel-frequency-grid,
            .cies-summary-panel,
            .cies-summary-detail-grid,
            .cies-summary-detail-grid--three,
            .associated-summary,
            .excel-export-layout,
            .excel-export-grid {
                grid-template-columns: 1fr;
            }

            :host ::ng-deep .cies-export-dialog .p-dialog-content {
                max-height: calc(92vh - 11rem) !important;
            }

            :host ::ng-deep .cies-export-dialog .p-dialog-footer {
                justify-content: stretch;
            }

            :host ::ng-deep .cies-export-dialog .p-dialog-footer button {
                flex: 1 1 100%;
            }

            .cies-chart-card {
                min-height: auto;
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
    graficosExcel: ReporteExcelGraficos | null = null;
    loading = false;
    downloading = false;
    excelDialogVisible = false;
    activeTab = '0';

    exportFilters: ReportFilters = {
        anio: '',
        fechaDesde: null,
        fechaHasta: null,
        regional: '',
        clinica: '',
        version: '',
        clasificacion: '',
        codigoVariable: 'SERVICIO'
    };

    excelSections = {
        presentacion: true,
        datos: true,
        calculos: true,
        frecuencias: true,
        vulnerabilidad: true
    };

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
    excelFactoresChartData: any = null;
    excelPobreChartData: any = null;
    excelPobrezaRegionalChartData: any = null;
    excelExclusionRegionalChartData: any = null;
    excelSubatencionRegionalChartData: any = null;
    excelRegionalChartData: any = null;
    excelCombinacionesChartData: any = null;
    frequencyPreviewCharts: Array<{ title: string; data: any; height: number }> = [];
    associatedSummary: Array<{ label: string; total: number }> = [];

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

    horizontalChartOptions: any = {
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14 } },
            tooltip: {
                callbacks: {
                    title: (items: any[]) => items?.[0]?.label || '',
                    label: (ctx: any) => {
                        const dsLabel = ctx.dataset?.label || '';
                        const pct = ctx.parsed?.x ?? ctx.raw ?? 0;
                        const comp = (this as any).resumen?.comparativoClinicas?.[ctx.dataIndex];
                        const conteo = comp ? this.absolutoSegunDataset(dsLabel, comp) : null;
                        const total = comp?.total ?? null;
                        return conteo != null && total != null
                            ? `${dsLabel}: ${pct}% (${conteo}/${total} entrevistas)`
                            : `${dsLabel}: ${pct}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                ticks: { callback: (v: string | number) => `${v}%` },
                grid: { color: 'rgba(0,0,0,0.05)' },
                title: { display: true, text: '% de entrevistas finalizadas' }
            },
            y: { grid: { display: false }, ticks: { autoSkip: false } }
        }
    };

    get comparativoChartHeight(): number {
        const n = this.resumen?.comparativoClinicas?.length || 0;
        // ~38px por clínica + 80px padding, mínimo 280, máximo 720
        return Math.min(720, Math.max(280, n * 38 + 80));
    }

    private absolutoSegunDataset(dsLabel: string, comp: any): number | null {
        if (!comp) return null;
        const lbl = (dsLabel || '').toLowerCase();
        if (lbl.includes('pobre'))      return comp.totalPobres ?? null;
        if (lbl.includes('exclu'))      return comp.totalExcluidas ?? null;
        if (lbl.includes('subaten'))    return comp.totalSubatendidas ?? null;
        return null;
    }

    frequencyChartOptions = {
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { beginAtZero: true, max: 100, ticks: { callback: (value: string | number) => `${value}%` } },
            y: { grid: { display: false } }
        }
    };

    percentByRegionalChartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => `${ctx.dataset?.label || ''}: ${ctx.parsed?.y ?? ctx.raw ?? 0}%`
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, max: 100, ticks: { callback: (value: string | number) => `${value}%` }, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
    };

    associatedChartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true } },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => `${ctx.dataset?.label || ''}: ${ctx.parsed?.y ?? ctx.raw ?? 0}%`
                }
            }
        },
        scales: {
            x: { stacked: false, grid: { display: false } },
            y: { beginAtZero: true, suggestedMax: 100, ticks: { callback: (value: string | number) => `${value}%` }, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
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
            distribucion: this.ciesService.getDistribucionVariable(filters),
            graficosExcel: this.ciesService.getGraficosExcel(filters)
        }).subscribe({
            next: ({ resumen, distribucion, graficosExcel }) => {
                this.resumen = resumen;
                this.distribucion = distribucion;
                this.graficosExcel = graficosExcel;
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

    openExportDialog(): void {
        if (this.loading || this.downloading || !this.resumen) {
            return;
        }
        this.exportFilters = this.cloneFilters(this.filters);
        this.excelDialogVisible = true;
    }

    download(type: 'excel' | 'csv' | 'sps'): void {
        if (this.loading || this.downloading) {
            return;
        }
        if (type === 'excel') {
            this.openExportDialog();
            return;
        }
        if (!this.validateFilters()) {
            return;
        }
        this.downloading = true;
        const filters = this.getFilterPayload();
        const request$ = type === 'csv' ? this.ciesService.exportCsv(filters) : this.ciesService.exportSps(filters);

        request$.subscribe({
            next: (blob) => {
                this.downloading = false;
                this.saveBlob(blob, `reporte-cies.${type === 'sps' ? 'sps' : 'csv'}`);
            },
            error: (err) => {
                this.downloading = false;
                console.error('Error downloading report:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el reporte' });
            }
        });
    }

    downloadExcelFromDialog(exportAll: boolean): void {
        if (this.loading || this.downloading) {
            return;
        }
        if (!this.hasSelectedExcelSection()) {
            this.messageService.add({ severity: 'warn', summary: 'Exportación incompleta', detail: 'Selecciona al menos una sección para el Excel.' });
            return;
        }
        if (!exportAll && !this.validateFilters(this.exportFilters)) {
            return;
        }

        this.downloading = true;
        const payload = this.getExcelExportPayload(exportAll);
        this.ciesService.exportExcel(payload).subscribe({
            next: (blob) => {
                this.downloading = false;
                this.excelDialogVisible = false;
                this.saveBlob(blob, exportAll ? 'cies-base-datos-vulnerabilidad-completa.xlsx' : 'cies-base-datos-vulnerabilidad.xlsx');
            },
            error: (err) => {
                this.downloading = false;
                console.error('Error downloading Excel report:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el Excel' });
            }
        });
    }

    getPorcentaje(total: number, dist: DistribucionVariable): number {
        const sum = dist.items.reduce((acc, item) => acc + item.total, 0);
        if (!sum) return 0;
        return Math.round((total / sum) * 100);
    }

    private getExcelFrequencyTitle(codigoVariable: string, fallback: string): string {
        const titles: Record<string, string> = {
            CLINICA: '% Clientes mujeres encuestadas por clínica',
            MIEMBROS_HOGAR: '% hogares según Nº de personas integrantes',
            JEFE_TRABAJO: '% Trabajo jefe del hogar',
            IDIOMA_NINEZ: '% Idioma o lengua que la jefa del hogar aprendió en su niñez',
            CUARTOS: '% Habitaciones de esta vivienda',
            MATERIAL_PISO: '% Materiales de construcción de la vivienda',
            TIPO_BANO: '% Tipo de baño o servicio higiénico en el hogar',
            COMBUSTIBLE: '% Tipo combustible que se utiliza para cocinar',
            REFRIGERADOR: '% Tiene o posee refrigerador o freezer',
            TELEVISOR: '% hogares que cuentan con un Televisor',
            VEHICULO: '% hogares que tienen una motocicleta o vehículo',
            IDIOMA_HOGAR: '% hogares según idioma que utilizan normalmente',
            EDUCACION: '% Último curso aprobado',
            METODO_AC: '% Uso de método anticonceptivo moderno',
            COMPUTADORA: '% Tiene o posee una computadora en el hogar',
            CELULAR: '% Tiene, posee o dispone de un celular',
            LUGAR_PARTO: '% lugar atención último parto',
            ZONA_RESIDENCIA: '% Residencia actual',
            ACCESO_SALUD: '% Últimos 12 meses que acudió a algún hospital'
        };
        return titles[codigoVariable?.toUpperCase()] || fallback;
    }

    private buildCharts(): void {
        if (this.resumen) {
            this.classificationChartData = {
                labels: ['Pobreza', 'Exclusión', 'Sub-atención', 'Sin vulnerabilidad'],
                datasets: [{
                    data: [this.resumen.totalPobres, this.resumen.totalExcluidas, this.resumen.totalSubatendidas, this.resumen.totalSinVulnerabilidad],
                    backgroundColor: ['#ef4444', '#f59e0b', '#0ea5e9', '#64748b'],
                    hoverOffset: 8
                }]
            };

            this.tendenciasChartData = {
                labels: this.resumen.tendencias.map((item) => item.etiqueta),
                datasets: [
                    { label: 'Total', data: this.resumen.tendencias.map((i) => i.total), backgroundColor: '#6366f1', borderRadius: 4 },
                    { label: 'Pobreza', data: this.resumen.tendencias.map((i) => i.pobres), backgroundColor: '#ef4444', borderRadius: 4 },
                    { label: 'Excluidas', data: this.resumen.tendencias.map((i) => i.excluidas), backgroundColor: '#f59e0b', borderRadius: 4 },
                    { label: 'Subatendidas', data: this.resumen.tendencias.map((i) => i.subatendidas), backgroundColor: '#0ea5e9', borderRadius: 4 }
                ]
            };

            // Ordenar clinicas por % de pobreza descendente para que el grafico sea facil de leer.
            // Mantenemos el orden original en this.resumen.comparativoClinicas (la tabla puede usar su propio sort).
            const clinicasOrdenadas = [...this.resumen.comparativoClinicas]
                .sort((a, b) => (b.porcentajePobres ?? 0) - (a.porcentajePobres ?? 0));
            // Re-asignamos el array ordenado al resumen para que los tooltips usen los mismos indices.
            this.resumen.comparativoClinicas = clinicasOrdenadas;
            this.clinicasChartData = {
                labels: clinicasOrdenadas.map((item) => item.clinica),
                datasets: [
                    { label: '% Pobre', data: clinicasOrdenadas.map((i) => i.porcentajePobres), backgroundColor: '#ef4444', borderRadius: 4, borderSkipped: false },
                    { label: '% Excluida', data: clinicasOrdenadas.map((i) => i.porcentajeExcluidas), backgroundColor: '#f59e0b', borderRadius: 4, borderSkipped: false },
                    { label: '% Subatendida', data: clinicasOrdenadas.map((i) => i.porcentajeSubatendidas), backgroundColor: '#0ea5e9', borderRadius: 4, borderSkipped: false }
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

        if (this.graficosExcel) {
            const palette = ['#0f766e', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#db2777', '#64748b'];
            const regionalLabels = this.graficosExcel.regionales.map((item) => item.regional);
            this.excelFactoresChartData = {
                labels: this.graficosExcel.cantidadFactores.map((item) => item.etiqueta),
                datasets: [{
                    data: this.graficosExcel.cantidadFactores.map((item) => item.total),
                    backgroundColor: palette,
                    hoverOffset: 8
                }]
            };
            this.excelPobreChartData = {
                labels: this.graficosExcel.vulnerabilidadPobre.map((item) => item.etiqueta),
                datasets: [{
                    data: this.graficosExcel.vulnerabilidadPobre.map((item) => item.total),
                    backgroundColor: ['#ef4444', '#10b981'],
                    hoverOffset: 8
                }]
            };
            this.excelPobrezaRegionalChartData = {
                labels: regionalLabels,
                datasets: [{
                    label: '% Pobreza',
                    data: this.graficosExcel.regionales.map((item) => item.porcentajePobres),
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }]
            };
            this.excelExclusionRegionalChartData = {
                labels: regionalLabels,
                datasets: [{
                    label: '% Exclusión',
                    data: this.graficosExcel.regionales.map((item) => item.porcentajeExcluidas),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                }]
            };
            this.excelSubatencionRegionalChartData = {
                labels: regionalLabels,
                datasets: [{
                    label: '% Sub-atención',
                    data: this.graficosExcel.regionales.map((item) => item.porcentajeSubatendidas),
                    backgroundColor: '#0ea5e9',
                    borderRadius: 4
                }]
            };
            this.excelRegionalChartData = {
                labels: regionalLabels,
                datasets: [
                    { label: 'Pobreza', data: this.graficosExcel.regionales.map((item) => item.porcentajePobres), backgroundColor: '#ef4444', borderRadius: 4 },
                    { label: 'Exclusión', data: this.graficosExcel.regionales.map((item) => item.porcentajeExcluidas), backgroundColor: '#f59e0b', borderRadius: 4 },
                    { label: 'Sub-atención', data: this.graficosExcel.regionales.map((item) => item.porcentajeSubatendidas), backgroundColor: '#0ea5e9', borderRadius: 4 }
                ]
            };
            const combinaciones = this.graficosExcel.combinaciones.length
                ? this.graficosExcel.combinaciones
                : [{
                    regional: 'Sin asociaciones registradas',
                    total: this.graficosExcel.totalEntrevistas,
                    pobrezaExclusion: 0,
                    pobrezaSubatencion: 0,
                    exclusionSubatencion: 0,
                    pobrezaExclusionAsociada: 0,
                    pobrezaSubatencionAsociada: 0,
                    exclusionSubatencionAsociada: 0,
                    porcentajePobrezaExclusion: 0,
                    porcentajePobrezaSubatencion: 0,
                    porcentajeExclusionSubatencion: 0,
                    porcentajePobrezaExclusionAsociada: 0,
                    porcentajePobrezaSubatencionAsociada: 0,
                    porcentajeExclusionSubatencionAsociada: 0
                }];
            const valorAsociado = (item: any, campoAsociado: string, campoBase: string) => Number.isFinite(item[campoAsociado]) ? item[campoAsociado] : item[campoBase];
            this.excelCombinacionesChartData = {
                labels: combinaciones.map((item) => item.regional),
                datasets: [
                    { label: 'Pobreza + Exclusión', data: combinaciones.map((item) => valorAsociado(item, 'porcentajePobrezaExclusionAsociada', 'porcentajePobrezaExclusion')), backgroundColor: '#7c2d12', borderRadius: 4 },
                    { label: 'Pobreza + Sub-atención', data: combinaciones.map((item) => valorAsociado(item, 'porcentajePobrezaSubatencionAsociada', 'porcentajePobrezaSubatencion')), backgroundColor: '#be123c', borderRadius: 4 },
                    { label: 'Exclusión + Sub-atención', data: combinaciones.map((item) => valorAsociado(item, 'porcentajeExclusionSubatencionAsociada', 'porcentajeExclusionSubatencion')), backgroundColor: '#0369a1', borderRadius: 4 }
                ]
            };
            this.associatedSummary = [
                { label: 'Pobreza + exclusión', total: this.graficosExcel.combinaciones.reduce((sum, item) => sum + valorAsociado(item, 'pobrezaExclusionAsociada', 'pobrezaExclusion'), 0) },
                { label: 'Pobreza + sub-atención', total: this.graficosExcel.combinaciones.reduce((sum, item) => sum + valorAsociado(item, 'pobrezaSubatencionAsociada', 'pobrezaSubatencion'), 0) },
                { label: 'Exclusión + sub-atención', total: this.graficosExcel.combinaciones.reduce((sum, item) => sum + valorAsociado(item, 'exclusionSubatencionAsociada', 'exclusionSubatencion'), 0) }
            ];
            this.frequencyPreviewCharts = this.graficosExcel.frecuencias
                .filter((variable) => variable.items.length)
                .map((variable, index) => ({
                    title: this.getExcelFrequencyTitle(variable.codigoVariable, variable.etiquetaPregunta),
                    height: this.getFrequencyChartHeight(variable.items.length),
                    data: {
                        labels: variable.items.map((item) => item.etiqueta),
                        datasets: [{
                            data: variable.items.map((item) => item.porcentaje),
                            backgroundColor: palette[index % palette.length],
                            borderRadius: 4
                        }]
                    }
                }));
        }
    }

    private getFrequencyChartHeight(itemCount: number): number {
        return Math.max(168, Math.min(320, itemCount * 34 + 72));
    }

    private validateFilters(filters: ReportFilters = this.filters): boolean {
        const anio = filters.anio.trim();
        if (anio && !/^\d{4}$/.test(anio)) {
            this.messageService.add({ severity: 'warn', summary: 'Filtro inválido', detail: 'El año debe tener 4 dígitos, por ejemplo 2026.' });
            return false;
        }
        if (filters.fechaDesde && filters.fechaHasta && filters.fechaDesde > filters.fechaHasta) {
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

    private cloneFilters(filters: ReportFilters): ReportFilters {
        return {
            ...filters,
            fechaDesde: filters.fechaDesde ? new Date(filters.fechaDesde) : null,
            fechaHasta: filters.fechaHasta ? new Date(filters.fechaHasta) : null
        };
    }

    private hasSelectedExcelSection(): boolean {
        return Object.values(this.excelSections).some(Boolean);
    }

    private getExcelExportPayload(exportAll: boolean): Record<string, string> {
        const payload: Record<string, string> = exportAll ? { todos: 'true' } : this.getFilterPayload(this.exportFilters);
        payload['incluirPresentacion'] = String(this.excelSections.presentacion);
        payload['incluirDatos'] = String(this.excelSections.datos);
        payload['incluirCalculos'] = String(this.excelSections.calculos);
        payload['incluirFrecuencias'] = String(this.excelSections.frecuencias);
        payload['incluirVulnerabilidad'] = String(this.excelSections.vulnerabilidad);
        return payload;
    }

    private saveBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    private formatDateParam(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private getFilterPayload(filters: ReportFilters = this.filters): Record<string, string> {
        return {
            anio: filters.anio.trim(),
            fechaDesde: filters.fechaDesde ? this.formatDateParam(filters.fechaDesde) : '',
            fechaHasta: filters.fechaHasta ? this.formatDateParam(filters.fechaHasta) : '',
            regional: filters.regional,
            clinica: filters.clinica,
            version: filters.version,
            clasificacion: filters.clasificacion,
            codigoVariable: filters.codigoVariable
        };
    }
}

