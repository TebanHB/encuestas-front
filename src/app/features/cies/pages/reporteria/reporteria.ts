import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, DistribucionVariable, Metodologia, ReporteResumen } from '../../services/cies.service';

interface ReportFilters {
    anio: string;
    regional: string;
    clinica: string;
    version: string;
    clasificacion: string;
    codigoVariable: string;
}

@Component({
    selector: 'app-reporteria-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ChartModule, InputTextModule, SelectModule, TableModule, CiesInfoHintComponent],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--blue">Reportería</div>
                    <h1 class="cies-hero__title">Indicadores institucionales</h1>
                    <p class="cies-hero__copy">Consulta consolidado nacional, comparativos por clínica y distribuciones del instrumento con filtros metodológicos.</p>
                </div>
                <div class="cies-hero__actions">
                    <button pButton type="button" label="Ver todo" icon="pi pi-eye" severity="secondary" [outlined]="true" (click)="resetFilters()"></button>
                    <button pButton type="button" label="Excel" icon="pi pi-file-excel" severity="success" (click)="download('excel')"></button>
                    <button pButton type="button" label="CSV" icon="pi pi-download" severity="secondary" (click)="download('csv')"></button>
                    <button pButton type="button" label="SPSS" icon="pi pi-database" severity="contrast" (click)="download('sps')"></button>
                </div>
            </section>

            <section class="cies-guidance-grid">
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">1</div>
                    <div class="cies-stack">
                        <h4>Empieza viendo todo</h4>
                        <p>Si no estás seguro de qué filtro usar, primero mira el panorama general y luego acota.</p>
                    </div>
                    <div class="cies-guidance-actions">
                        <button pButton type="button" label="Ver todo" (click)="resetFilters()"></button>
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
                        <p>Cuando ya revisaste la pantalla, descarga Excel, CSV o SPSS sin cambiar de módulo.</p>
                    </div>
                </article>
            </section>

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
                        <input pInputText [(ngModel)]="filters.anio" class="w-full" />
                    </div>
                    <div>
                        <label>Regional</label>
                        <input pInputText [(ngModel)]="filters.regional" class="w-full" />
                    </div>
                    <div>
                        <label>Clínica</label>
                        <input pInputText [(ngModel)]="filters.clinica" class="w-full" />
                    </div>
                    <div>
                        <label>Versión metodológica</label>
                        <p-select [options]="versionOptions" [(ngModel)]="filters.version" optionLabel="label" optionValue="value" appendTo="body" class="w-full"></p-select>
                    </div>
                    <div>
                        <label>Clasificación</label>
                        <p-select [options]="clasificaciones" [(ngModel)]="filters.clasificacion" optionLabel="label" optionValue="value" appendTo="body" class="w-full"></p-select>
                    </div>
                    <div>
                        <label>Variable</label>
                        <input pInputText [(ngModel)]="filters.codigoVariable" class="w-full" />
                    </div>
                    <div class="cies-actions-row">
                        <button pButton type="button" label="Aplicar filtros" icon="pi pi-filter" (click)="load()"></button>
                        <button pButton type="button" label="Limpiar" severity="secondary" [outlined]="true" icon="pi pi-times" (click)="resetFilters()"></button>
                    </div>
                </div>
            </section>

            <section *ngIf="resumen" class="cies-stats-grid">
                <article class="card cies-stat-card">
                    <div class="cies-card-caption">
                        <span>Total entrevistas</span>
                        <app-cies-info-hint text="Número de entrevistas incluidas en el análisis actual."></app-cies-info-hint>
                    </div>
                    <strong>{{ resumen.totalEntrevistas }}</strong>
                </article>
                <article class="card cies-stat-card">
                    <div class="cies-card-caption">
                        <span>Pobres</span>
                        <app-cies-info-hint text="Total de entrevistas clasificadas como pobreza."></app-cies-info-hint>
                    </div>
                    <strong>{{ resumen.totalPobres }}</strong>
                </article>
                <article class="card cies-stat-card">
                    <div class="cies-card-caption">
                        <span>Excluidas</span>
                        <app-cies-info-hint text="Total de entrevistas clasificadas como exclusión."></app-cies-info-hint>
                    </div>
                    <strong>{{ resumen.totalExcluidas }}</strong>
                </article>
                <article class="card cies-stat-card">
                    <div class="cies-card-caption">
                        <span>Subatendidas</span>
                        <app-cies-info-hint text="Total de entrevistas clasificadas como subatención."></app-cies-info-hint>
                    </div>
                    <strong>{{ resumen.totalSubatendidas }}</strong>
                </article>
            </section>

            <section *ngIf="resumen && !hasResults" class="card">
                <div class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-chart-bar"></i>
                    </div>
                    <h3>No hay resultados con esos filtros</h3>
                    <p>Prueba quitando filtros o usando la vista general. Si no sabes qué poner, empieza dejando todo vacío.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Ver todo" icon="pi pi-refresh" (click)="resetFilters()"></button>
                    </div>
                </div>
            </section>

            <section class="cies-chart-grid" *ngIf="resumen && hasResults">
                <article class="card cies-chart-card">
                    <div class="cies-section-head">
                        <div class="cies-section-head__content">
                            <div>
                                <h3>Clasificación consolidada</h3>
                                <p>Distribución global según la versión y filtros vigentes.</p>
                            </div>
                            <app-cies-info-hint text="Resume el peso relativo de pobreza, exclusión y subatención dentro del conjunto filtrado."></app-cies-info-hint>
                        </div>
                    </div>
                    <p-chart type="doughnut" [data]="classificationChartData" [options]="classificationChartOptions"></p-chart>
                </article>

                <article class="card cies-chart-card">
                    <div class="cies-section-head">
                        <div class="cies-section-head__content">
                            <div>
                                <h3>Tendencias</h3>
                                <p>Serie anual o mensual según el año filtrado.</p>
                            </div>
                            <app-cies-info-hint text="Permite detectar cambios en el comportamiento del instrumento a lo largo del tiempo."></app-cies-info-hint>
                        </div>
                    </div>
                    <p-chart type="bar" [data]="tendenciasChartData" [options]="barChartOptions"></p-chart>
                </article>
            </section>

            <section *ngIf="resumen && hasResults" class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Comparativo por clínica</h3>
                            <p>Porcentaje de clasificación sobre entrevistas válidas.</p>
                        </div>
                        <app-cies-info-hint text="Compara sedes bajo el mismo criterio metodológico y los mismos filtros activos."></app-cies-info-hint>
                    </div>
                </div>
                <p-chart type="bar" [data]="clinicasChartData" [options]="horizontalChartOptions"></p-chart>
                <p-table [value]="resumen.comparativoClinicas" [tableStyle]="{ 'min-width': '58rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Clínica</th>
                            <th>Total</th>
                            <th>% pobres</th>
                            <th>% excluidas</th>
                            <th>% subatendidas</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>{{ item.clinica }}</td>
                            <td>{{ item.total }}</td>
                            <td>{{ item.porcentajePobres }}%</td>
                            <td>{{ item.porcentajeExcluidas }}%</td>
                            <td>{{ item.porcentajeSubatendidas }}%</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section *ngIf="distribucion && hasResults" class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Distribución por variable</h3>
                            <p>{{ distribucion.codigoVariable }} - {{ distribucion.etiquetaPregunta }}</p>
                        </div>
                        <app-cies-info-hint text="Muestra cómo se repartieron las respuestas en una pregunta específica del instrumento."></app-cies-info-hint>
                    </div>
                </div>
                <p-chart type="pie" [data]="distributionChartData" [options]="pieChartOptions"></p-chart>
                <p-table [value]="distribucion.items" [tableStyle]="{ 'min-width': '42rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Etiqueta</th>
                            <th>Total</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>{{ item.etiqueta }}</td>
                            <td>{{ item.total }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>
    `,
    styles: [
        `
            .cies-chart-card {
                min-height: 25rem;
            }
        `
    ]
})
export class ReporteriaPage implements OnInit {
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);

    resumen: ReporteResumen | null = null;
    distribucion: DistribucionVariable | null = null;
    versionOptions: Array<{ label: string; value: string }> = [{ label: 'Todas', value: '' }];

    classificationChartData: any = null;
    tendenciasChartData: any = null;
    clinicasChartData: any = null;
    distributionChartData: any = null;

    classificationChartOptions = { plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false };
    pieChartOptions = { plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false };
    barChartOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: false }, y: { beginAtZero: true } }
    };
    horizontalChartOptions = {
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { beginAtZero: true, max: 100 } }
    };

    filters: ReportFilters = {
        anio: '',
        regional: '',
        clinica: '',
        version: '',
        clasificacion: '',
        codigoVariable: 'SERVICIO'
    };

    clasificaciones = [
        { label: 'Todas', value: '' },
        { label: 'Pobre', value: 'POBRE' },
        { label: 'Excluida', value: 'EXCLUIDA' },
        { label: 'Subatendida', value: 'SUBATENDIDA' }
    ];

    ngOnInit(): void {
        this.ciesService.listMetodologias().subscribe({
            next: (response: Metodologia[]) => {
                this.versionOptions = [{ label: 'Todas', value: '' }, ...response.map((item) => ({ label: item.nombre, value: item.nombre }))];
                this.cdr.detectChanges();
            }
        });

        this.load();
    }

    get hasResults(): boolean {
        return (this.resumen?.totalEntrevistas || 0) > 0;
    }

    load(): void {
        const filters = this.getFilterPayload();
        this.ciesService.getReporteResumen(filters).subscribe({
            next: (response) => {
                this.resumen = response;
                this.buildCharts();
                this.cdr.detectChanges();
            }
        });
        this.ciesService.getDistribucionVariable(filters).subscribe({
            next: (response) => {
                this.distribucion = response;
                this.buildCharts();
                this.cdr.detectChanges();
            }
        });
    }

    resetFilters(): void {
        this.filters = {
            anio: '',
            regional: '',
            clinica: '',
            version: '',
            clasificacion: '',
            codigoVariable: 'SERVICIO'
        };
        this.load();
    }

    download(type: 'excel' | 'csv' | 'sps'): void {
        const filters = this.getFilterPayload();
        const request$ =
            type === 'excel' ? this.ciesService.exportExcel(filters) : type === 'csv' ? this.ciesService.exportCsv(filters) : this.ciesService.exportSps(filters);

        request$.subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `reporte-cies.${type === 'excel' ? 'xlsx' : type}`;
                link.click();
                URL.revokeObjectURL(url);
            }
        });
    }

    private buildCharts(): void {
        if (this.resumen) {
            this.classificationChartData = {
                labels: ['Pobres', 'Excluidas', 'Subatendidas'],
                datasets: [
                    {
                        data: [this.resumen.totalPobres, this.resumen.totalExcluidas, this.resumen.totalSubatendidas],
                        backgroundColor: ['#ef4444', '#f59e0b', '#0ea5e9']
                    }
                ]
            };

            this.tendenciasChartData = {
                labels: this.resumen.tendencias.map((item) => item.etiqueta),
                datasets: [
                    { label: 'Total', data: this.resumen.tendencias.map((item) => item.total), backgroundColor: '#1d4ed8' },
                    { label: 'Pobres', data: this.resumen.tendencias.map((item) => item.pobres), backgroundColor: '#ef4444' },
                    { label: 'Excluidas', data: this.resumen.tendencias.map((item) => item.excluidas), backgroundColor: '#f59e0b' },
                    { label: 'Subatendidas', data: this.resumen.tendencias.map((item) => item.subatendidas), backgroundColor: '#0ea5e9' }
                ]
            };

            this.clinicasChartData = {
                labels: this.resumen.comparativoClinicas.map((item) => item.clinica),
                datasets: [
                    { label: '% pobres', data: this.resumen.comparativoClinicas.map((item) => item.porcentajePobres), backgroundColor: '#ef4444' },
                    { label: '% excluidas', data: this.resumen.comparativoClinicas.map((item) => item.porcentajeExcluidas), backgroundColor: '#f59e0b' },
                    { label: '% subatendidas', data: this.resumen.comparativoClinicas.map((item) => item.porcentajeSubatendidas), backgroundColor: '#0ea5e9' }
                ]
            };
        }

        if (this.distribucion) {
            this.distributionChartData = {
                labels: this.distribucion.items.map((item) => item.etiqueta),
                datasets: [
                    {
                        data: this.distribucion.items.map((item) => item.total),
                        backgroundColor: ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
                    }
                ]
            };
        }
    }

    private getFilterPayload(): Record<string, string> {
        return {
            anio: this.filters.anio,
            regional: this.filters.regional,
            clinica: this.filters.clinica,
            version: this.filters.version,
            clasificacion: this.filters.clasificacion,
            codigoVariable: this.filters.codigoVariable
        };
    }
}

