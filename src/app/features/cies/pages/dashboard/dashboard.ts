import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FechaCortaPipe, NombrePropioPipe } from '../../../../shared/pipes/formato.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, PersonaElegible, ReporteResumen } from '../../services/cies.service';

interface QuickStartCard {
    paso: string;
    titulo: string;
    descripcion: string;
    actionLabel: string;
    routerLink: string;
    severity?: 'secondary' | 'success' | 'contrast' | 'info' | 'warn' | 'help' | 'danger';
    outlined?: boolean;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TableModule, TagModule, CiesInfoHintComponent, FechaCortaPipe, NombrePropioPipe],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--gris">Sistema CIES</div>
                    <h1 class="cies-hero__title">{{ titulo }}</h1>
                    <p class="cies-hero__copy">{{ subtitulo }}</p>
                </div>

                <div class="cies-hero__actions">
                    <a *ngIf="isAdmin" routerLink="/pages/seleccion"><button pButton type="button" label="Registrar personas" icon="pi pi-user-plus"></button></a>
                    <a *ngIf="isAdmin" routerLink="/pages/metodologia"><button pButton type="button" label="Configurar preguntas" icon="pi pi-sliders-h" severity="secondary"></button></a>
                    <a *ngIf="isEncuestador" routerLink="/pages/entrevistas"><button pButton type="button" label="Empezar a entrevistar" icon="pi pi-file-edit"></button></a>
                    <a *ngIf="isAnalista" routerLink="/pages/reporteria"><button pButton type="button" label="Ver resultados" icon="pi pi-chart-bar"></button></a>
                </div>
            </section>

            <section class="cies-guidance-grid">
                <article class="card cies-guidance-card" *ngFor="let item of quickStartCards">
                    <div class="cies-guidance-step">{{ item.paso }}</div>
                    <div class="cies-stack">
                        <h4>{{ item.titulo }}</h4>
                        <p>{{ item.descripcion }}</p>
                    </div>
                    <div class="cies-guidance-actions">
                        <a [routerLink]="item.routerLink">
                            <button pButton type="button" [label]="item.actionLabel" [severity]="item.severity || undefined" [outlined]="item.outlined || false"></button>
                        </a>
                    </div>
                </article>
            </section>

            <section class="card cies-soft-note">
                <strong>Qué hacer primero:</strong>
                {{ quickStartNote }}
            </section>

            <section class="card" *ngIf="isEncuestador && !totalPendientes">
                <div class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-file-edit"></i>
                    </div>
                    <h3>No tienes entrevistas pendientes ahora mismo</h3>
                    <p>
                        Si llegó una sola persona y debes atenderla de inmediato, entra a entrevistas y usa el botón
                        <strong>Entrevistar a una persona</strong>. El sistema la registrará y abrirá la entrevista en el mismo paso.
                    </p>
                    <div class="cies-empty-state__actions">
                        <a routerLink="/pages/entrevistas"><button pButton type="button" label="Abrir entrevistas" icon="pi pi-arrow-right"></button></a>
                    </div>
                </div>
            </section>

            <section *ngIf="resumen" class="cies-stats-grid">
                <article class="card cies-stat-card">
                    <div class="cies-card-caption">
                        <span>Total entrevistas</span>
                        <app-cies-info-hint text="Cantidad total de entrevistas finalizadas que cumplen con los filtros vigentes."></app-cies-info-hint>
                    </div>
                    <strong>{{ resumen.totalEntrevistas }}</strong>
                </article>
                <article class="card cies-stat-card">
                    <div class="cies-card-caption">
                        <span>% pobres</span>
                        <app-cies-info-hint text="Proporción de entrevistas clasificadas como pobreza según la metodología activa."></app-cies-info-hint>
                    </div>
                    <strong>{{ resumen.porcentajePobres }}%</strong>
                </article>
                <article class="card cies-stat-card">
                    <div class="cies-card-caption">
                        <span>% excluidas</span>
                        <app-cies-info-hint text="Proporción de entrevistas clasificadas como exclusión."></app-cies-info-hint>
                    </div>
                    <strong>{{ resumen.porcentajeExcluidas }}%</strong>
                </article>
                <article class="card cies-stat-card">
                    <div class="cies-card-caption">
                        <span>% subatendidas</span>
                        <app-cies-info-hint text="Proporción de entrevistas clasificadas como subatención."></app-cies-info-hint>
                    </div>
                    <strong>{{ resumen.porcentajeSubatendidas }}%</strong>
                </article>
            </section>

            <section *ngIf="pendientes.length" class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Lo siguiente que puedes hacer</h3>
                            <p>
                                Casos que ya están listos para entrevistar.
                                <span *ngIf="totalPendientes > pendientes.length">Aquí solo ves los primeros {{ pendientes.length }}.</span>
                            </p>
                        </div>
                        <app-cies-info-hint text="Muestra los casos priorizados para trabajo de campo. En encuestadores incluye las entrevistas en curso tomadas por ese usuario."></app-cies-info-hint>
                    </div>
                    <div class="cies-guidance-actions">
                        <p-tag [value]="totalPendientes + ' pendientes'" severity="warn"></p-tag>
                        <a routerLink="/pages/entrevistas" *ngIf="isAdmin || isEncuestador"><button pButton type="button" label="Abrir entrevistas" size="small"></button></a>
                    </div>
                </div>

                <p-table [value]="pendientes" [tableStyle]="{ 'min-width': '48rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Entrevista</th>
                            <th>Persona</th>
                            <th>Sede</th>
                            <th>Regional</th>
                            <th>Fecha</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>
                                <span class="font-medium">{{ item.codigoEntrevista || 'Sin código' }}</span>
                            </td>
                            <td>{{ item.nombreCompleto | nombrePropio }}</td>
                            <td>{{ item.clinica }}</td>
                            <td>{{ item.regional }}</td>
                            <td class="text-muted">{{ item.fechaConsulta | fechaCorta }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>
    `,
    styles: [
        `
            .cies-hero__actions a {
                display: inline-flex;
            }
        `
    ]
})
export class Dashboard implements OnInit {
    private authService = inject(AuthService);
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    resumen: ReporteResumen | null = null;
    pendientes: PersonaElegible[] = [];
    totalPendientes = 0;

    get isAdmin(): boolean {
        return this.authService.isAdministrador();
    }

    get isEncuestador(): boolean {
        return this.authService.isEncuestador();
    }

    get isAnalista(): boolean {
        return this.authService.isAnalista();
    }

    get titulo(): string {
        if (this.isAdmin) return 'Bienvenido al panel de trabajo CIES';
        if (this.isEncuestador) return 'Aquí empiezas tus entrevistas';
        return 'Aquí ves los resultados del sistema';
    }

    get subtitulo(): string {
        if (this.isAdmin) return 'Desde aquí puedes registrar personas, configurar el instrumento, revisar resultados y administrar cuentas.';
        if (this.isEncuestador) return 'Si ya tienes personas pendientes, abre su entrevista. Si llegó una sola persona, puedes registrarla y empezar de inmediato.';
        return 'Consulta indicadores, filtra resultados y exporta la información sin entrar a configuraciones técnicas.';
    }

    get quickStartCards(): QuickStartCard[] {
        if (this.isAdmin) {
            return [
                {
                    paso: '1',
                    titulo: 'Si llegó una sola persona',
                    descripcion: 'Usa la entrevista directa para registrarla y empezar sin cargar archivos ni crear lotes manualmente.',
                    actionLabel: 'Entrevistar ahora',
                    routerLink: '/pages/entrevistas'
                },
                {
                    paso: '2',
                    titulo: 'Si llegaron varias personas',
                    descripcion: 'Pega el listado o sube un CSV para registrar varias personas de una sola vez.',
                    actionLabel: 'Registrar varias personas',
                    routerLink: '/pages/seleccion',
                    severity: 'secondary'
                },
                {
                    paso: '3',
                    titulo: 'Si cambió la forma de clasificar',
                    descripcion: 'Ajusta preguntas, ponderaciones y umbrales solo cuando realmente necesites cambiar la metodología.',
                    actionLabel: 'Configurar preguntas',
                    routerLink: '/pages/metodologia',
                    severity: 'secondary',
                    outlined: true
                }
            ];
        }

        if (this.isEncuestador) {
            return [
                {
                    paso: '1',
                    titulo: 'Si la persona ya aparece en la lista',
                    descripcion: 'Solo pulsa Iniciar y completa la entrevista guiándote por las preguntas obligatorias.',
                    actionLabel: 'Abrir mi lista',
                    routerLink: '/pages/entrevistas'
                },
                {
                    paso: '2',
                    titulo: 'Si es una persona nueva',
                    descripcion: 'Usa el botón Entrevistar a una persona para registrarla y empezar en el mismo paso.',
                    actionLabel: 'Registrar y entrevistar',
                    routerLink: '/pages/entrevistas',
                    severity: 'secondary'
                },
                {
                    paso: '3',
                    titulo: 'Si no tienes internet',
                    descripcion: 'Puedes guardar la entrevista offline y el sistema la enviará cuando vuelva la conexión.',
                    actionLabel: 'Ver entrevistas',
                    routerLink: '/pages/entrevistas',
                    severity: 'secondary',
                    outlined: true
                }
            ];
        }

        return [
            {
                paso: '1',
                titulo: 'Empieza viendo todo',
                descripcion: 'Abre reportería y revisa primero los resultados generales antes de usar filtros más finos.',
                actionLabel: 'Abrir reportería',
                routerLink: '/pages/reporteria'
            },
            {
                paso: '2',
                titulo: 'Filtra solo si lo necesitas',
                descripcion: 'Usa año, regional o clínica únicamente cuando quieras responder una pregunta puntual.',
                actionLabel: 'Ir a resultados',
                routerLink: '/pages/reporteria',
                severity: 'secondary'
            },
            {
                paso: '3',
                titulo: 'Exporta cuando ya lo revisaste',
                descripcion: 'Descarga Excel, CSV o SPSS directamente desde la misma pantalla de resultados.',
                actionLabel: 'Ver y exportar',
                routerLink: '/pages/reporteria',
                severity: 'secondary',
                outlined: true
            }
        ];
    }

    get quickStartNote(): string {
        if (this.isAdmin) {
            return 'Primero registra personas. Después aplica entrevistas. Al final revisa los resultados.';
        }

        if (this.isEncuestador) {
            return 'Primero abre una persona. Luego responde todas las preguntas obligatorias. Al final finaliza o guarda offline.';
        }

        return 'Primero mira el panorama general. Luego filtra solo lo necesario. Al final exporta el reporte.';
    }

    ngOnInit(): void {
        if (this.isAdmin || this.isAnalista) {
            this.ciesService.getReporteResumen().subscribe({
                next: (response) => {
                    this.resumen = response;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error al cargar resumen:', err);
                    // Mostrar resumen vacío en caso de error
                    this.resumen = {
                        totalEntrevistas: 0,
                        totalPobres: 0,
                        totalExcluidas: 0,
                        totalSubatendidas: 0,
                        porcentajePobres: 0,
                        porcentajeExcluidas: 0,
                        porcentajeSubatendidas: 0,
                        tendencias: [],
                        comparativoClinicas: []
                    };
                    this.cdr.detectChanges();
                }
            });
        }

        if (this.isAdmin || this.isEncuestador) {
            this.ciesService.getPendientesEntrevista().subscribe({
                next: (response) => {
                    this.totalPendientes = response.length;
                    this.pendientes = response.slice(0, 8);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error al cargar pendientes:', err);
                    this.totalPendientes = 0;
                    this.pendientes = [];
                    this.cdr.detectChanges();
                }
            });
        }
    }
}

