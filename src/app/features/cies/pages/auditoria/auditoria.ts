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
import { CiesInfoHintComponent } from '../../components/cies-info-hint';

export interface AuditoriaRegistro {
    id: number;
    tipo: string;
    usuario: string;
    fechaHora: string;
    entidadAfectada?: string;
    idEntidad?: number;
    descripcion?: string;
    datosAnteriores?: string;
    datosNuevos?: string;
    direccionIp?: string;
    userAgent?: string;
    resultado: string;
}

@Component({
    selector: 'app-auditoria-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DatePickerModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule, Toast, CiesInfoHintComponent],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--orange">Seguridad</div>
                    <h1 class="cies-hero__title">Auditoría del Sistema</h1>
                    <p class="cies-hero__copy">Consulta el historial completo de eventos y cambios realizados en el sistema.</p>
                </div>
            </section>

            <section class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <h3>Filtros de Búsqueda</h3>
                        <p>Refina los resultados por tipo de evento, usuario o rango de fechas.</p>
                    </div>
                </div>

                <div class="cies-form-grid cies-form-grid--three">
                    <div>
                        <label>Tipo de Evento</label>
                        <p-select 
                            [options]="tipoEventos" 
                            [(ngModel)]="filtros.tipo" 
                            optionLabel="label" 
                            optionValue="value" 
                            appendTo="body" 
                            class="w-full"
                            placeholder="Todos los eventos">
                        </p-select>
                    </div>
                    <div>
                        <label>Usuario</label>
                        <input pInputText [(ngModel)]="filtros.usuario" class="w-full" placeholder="Buscar por usuario..." />
                    </div>
                    <div>
                        <label>Fecha Inicio</label>
                        <p-datepicker [(ngModel)]="filtros.fechaInicio" dateFormat="yy-mm-dd" class="w-full" [showIcon]="true"></p-datepicker>
                    </div>
                    <div>
                        <label>Fecha Fin</label>
                        <p-datepicker [(ngModel)]="filtros.fechaFin" dateFormat="yy-mm-dd" class="w-full" [showIcon]="true"></p-datepicker>
                    </div>
                    <div class="cies-field--full" style="display: flex; gap: 0.5rem; align-items: flex-end;">
                        <button pButton type="button" label="Buscar" icon="pi pi-search" (click)="buscar()"></button>
                        <button pButton type="button" label="Limpiar" icon="pi pi-eraser" severity="secondary" [outlined]="true" (click)="limpiarFiltros()"></button>
                    </div>
                </div>
            </section>

            <section class="card" *ngIf="registros.length">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Registros de Auditoría</h3>
                            <p>{{ registros.length }} eventos encontrados</p>
                        </div>
                        <app-cies-info-hint text="Cada registro muestra quién hizo qué, cuándo y con qué resultado."></app-cies-info-hint>
                    </div>
                </div>

                <p-table [value]="registros" [tableStyle]="{ 'min-width': '72rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Fecha/Hora</th>
                            <th>Tipo de Evento</th>
                            <th>Usuario</th>
                            <th>Descripción</th>
                            <th>Entidad</th>
                            <th>IP</th>
                            <th>Resultado</th>
                            <th>Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>{{ formatearFecha(item.fechaHora) }}</td>
                            <td>
                                <p-tag [value]="item.tipo" [severity]="getTipoSeverity(item.tipo)"></p-tag>
                            </td>
                            <td>{{ item.usuario }}</td>
                            <td>{{ item.descripcion || 'Sin descripción' }}</td>
                            <td>{{ item.entidadAfectada ? item.entidadAfectada + ' #' + item.idEntidad : '-' }}</td>
                            <td>{{ item.direccionIp || '-' }}</td>
                            <td>
                                <p-tag 
                                    [value]="item.resultado" 
                                    [severity]="item.resultado === 'EXITO' ? 'success' : item.resultado === 'ERROR' ? 'danger' : 'warn'">
                                </p-tag>
                            </td>
                            <td>
                                <div class="cies-inline-actions">
                                    <button pButton type="button" icon="pi pi-eye" text rounded severity="info" (click)="verDetalle(item)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section class="card" *ngIf="!registros.length && busquedaRealizada">
                <div class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-shield"></i>
                    </div>
                    <h3>No se encontraron registros</h3>
                    <p>Intenta ajustar los filtros de búsqueda para ver más resultados.</p>
                </div>
            </section>

            <section class="card" *ngIf="!busquedaRealizada">
                <div class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-clock"></i>
                    </div>
                    <h3>Selecciona filtros y presiona Buscar</h3>
                    <p>Puedes filtrar por tipo de evento, usuario y rango de fechas.</p>
                </div>
            </section>
        </div>

        <p-dialog
            [(visible)]="showDetalle"
            [modal]="true"
            [style]="{ width: '56rem', 'max-width': '96vw' }"
            [contentStyle]="{ overflow: 'visible' }"
            [draggable]="false"
            [resizable]="false"
            header="Detalle del Evento"
            styleClass="cies-dialog"
        >
            <div *ngIf="registroSeleccionado" class="cies-form-grid cies-form-grid--two cies-dialog-form">
                <div class="cies-field--full">
                    <label>Tipo de Evento</label>
                    <p-tag [value]="registroSeleccionado.tipo" [severity]="getTipoSeverity(registroSeleccionado.tipo)"></p-tag>
                </div>
                <div>
                    <label>Fecha y Hora</label>
                    <input pInputText [ngModel]="formatearFecha(registroSeleccionado.fechaHora)" class="w-full" readonly />
                </div>
                <div>
                    <label>Usuario</label>
                    <input pInputText [ngModel]="registroSeleccionado.usuario" class="w-full" readonly />
                </div>
                <div class="cies-field--full">
                    <label>Descripción</label>
                    <textarea pTextarea [ngModel]="registroSeleccionado.descripcion || 'Sin descripción'" rows="2" class="w-full" readonly></textarea>
                </div>
                <div>
                    <label>Entidad Afectada</label>
                    <input pInputText [ngModel]="registroSeleccionado.entidadAfectada || '-'" class="w-full" readonly />
                </div>
                <div>
                    <label>ID Entidad</label>
                    <input pInputText [ngModel]="registroSeleccionado.idEntidad || '-'" class="w-full" readonly />
                </div>
                <div>
                    <label>Dirección IP</label>
                    <input pInputText [ngModel]="registroSeleccionado.direccionIp || '-'" class="w-full" readonly />
                </div>
                <div>
                    <label>Resultado</label>
                    <p-tag 
                        [value]="registroSeleccionado.resultado" 
                        [severity]="registroSeleccionado.resultado === 'EXITO' ? 'success' : registroSeleccionado.resultado === 'ERROR' ? 'danger' : 'warn'">
                    </p-tag>
                </div>
                <div class="cies-field--full" *ngIf="registroSeleccionado.datosAnteriores">
                    <label>Datos Anteriores</label>
                    <textarea pTextarea [ngModel]="registroSeleccionado.datosAnteriores" rows="4" class="w-full" readonly style="font-family: monospace;"></textarea>
                </div>
                <div class="cies-field--full" *ngIf="registroSeleccionado.datosNuevos">
                    <label>Datos Nuevos</label>
                    <textarea pTextarea [ngModel]="registroSeleccionado.datosNuevos" rows="4" class="w-full" readonly style="font-family: monospace;"></textarea>
                </div>
                <div class="cies-field--full" *ngIf="registroSeleccionado.userAgent">
                    <label>User Agent</label>
                    <input pInputText [ngModel]="registroSeleccionado.userAgent" class="w-full" readonly />
                </div>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cerrar" severity="secondary" [outlined]="true" (click)="showDetalle = false"></button>
            </ng-template>
        </p-dialog>

        <p-toast></p-toast>
    `,
    styles: []
})
export class AuditoriaPage implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);

    registros: AuditoriaRegistro[] = [];
    showDetalle = false;
    registroSeleccionado: AuditoriaRegistro | null = null;
    busquedaRealizada = false;

    filtros = {
        tipo: '',
        usuario: '',
        fechaInicio: null as Date | null,
        fechaFin: null as Date | null
    };

    tipoEventos = [
        { label: 'Todos los eventos', value: '' },
        { label: 'Acceso de Usuario', value: 'ACCESO_USUARIO' },
        { label: 'Cambio de Metodología', value: 'CAMBIOS_METODOLOGIA' },
        { label: 'Selección Aleatoria', value: 'SELECCION_ALEATORIA' },
        { label: 'Inicio de Entrevista', value: 'INICIO_ENTREVISTA' },
        { label: 'Finalización de Entrevista', value: 'FINALIZACION_ENTREVISTA' },
        { label: 'Cálculo de Clasificación', value: 'CALCULO_CLASIFICACION' },
        { label: 'Exportación de Reporte', value: 'EXPORTACION_REPORTE' },
        { label: 'Creación de Usuario', value: 'CREACION_USUARIO' },
        { label: 'Modificación de Usuario', value: 'MODIFICACION_USUARIO' },
        { label: 'Eliminación de Usuario', value: 'ELIMINACION_USUARIO' },
        { label: 'Creación de Lote', value: 'CREACION_LOTE' },
        { label: 'Eliminación de Lote', value: 'ELIMINACION_LOTE' },
        { label: 'Integración Medicare', value: 'INTEGRACION_MEDICARE' }
    ];

    ngOnInit(): void {
        // Cargar últimos registros automáticamente
        this.buscar();
    }

    buscar(): void {
        // Simular carga de datos (en producción, llamar al servicio REST)
        this.busquedaRealizada = true;
        
        // Datos de ejemplo para demostración
        this.registros = [
            {
                id: 1,
                tipo: 'CREACION_USUARIO',
                usuario: 'admin@cies.org.bo',
                fechaHora: new Date().toISOString(),
                entidadAfectada: 'Usuario',
                idEntidad: 5,
                descripcion: 'Usuario creado: Maria Lopez (maria@cies.org.bo) - Rol: ENCUESTADOR',
                datosNuevos: '{"email":"maria@cies.org.bo","rol":"ENCUESTADOR"}',
                direccionIp: '192.168.1.100',
                userAgent: 'Mozilla/5.0...',
                resultado: 'EXITO'
            },
            {
                id: 2,
                tipo: 'FINALIZACION_ENTREVISTA',
                usuario: 'encuestador1@cies.org.bo',
                fechaHora: new Date(Date.now() - 3600000).toISOString(),
                entidadAfectada: 'EntrevistaCies',
                idEntidad: 42,
                descripcion: 'Entrevista finalizada: ENT-12345 - Clasificación: POBRE',
                datosNuevos: '{"puntaje":65,"clasificacion":"POBRE"}',
                direccionIp: '192.168.1.105',
                resultado: 'EXITO'
            }
        ];
        
        this.messageService.add({ severity: 'success', summary: 'Búsqueda completada', detail: `${this.registros.length} registros encontrados` });
        this.cdr.detectChanges();
    }

    limpiarFiltros(): void {
        this.filtros = {
            tipo: '',
            usuario: '',
            fechaInicio: null,
            fechaFin: null
        };
        this.busquedaRealizada = false;
        this.registros = [];
        this.cdr.detectChanges();
    }

    verDetalle(registro: AuditoriaRegistro): void {
        this.registroSeleccionado = registro;
        this.showDetalle = true;
    }

    formatearFecha(fechaStr: string): string {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleString('es-BO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    getTipoSeverity(tipo: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        if (tipo.includes('CREACION') || tipo.includes('INICIO') || tipo.includes('ACCESO')) return 'success';
        if (tipo.includes('ELIMINACION') || tipo.includes('ERROR')) return 'danger';
        if (tipo.includes('MODIFICACION') || tipo.includes('CAMBIO')) return 'warn';
        return 'info';
    }
}
