import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { FechaCortaPipe, EstadoTextoPipe } from '../../../../shared/pipes/formato.pipe';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, EjecucionSeleccion, LoteMedicare } from '../../services/cies.service';

@Component({
    selector: 'app-seleccion-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, TableModule, TagModule, TextareaModule, Toast, FechaCortaPipe, EstadoTextoPipe, CiesInfoHintComponent],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--morado">Registro de personas</div>
                    <h1 class="cies-hero__title">Registrar personas para entrevistar</h1>
                    <p class="cies-hero__copy">
                        Carga un listado completo desde Excel, CSV o JSON. Si solo llego una persona,
                        puedes registrarla directamente desde entrevistas.
                    </p>
                </div>
                <div class="cies-hero__actions">
                    <a routerLink="/pages/entrevistas"><button pButton type="button" label="Registrar una persona" icon="pi pi-user-plus"></button></a>
                </div>
            </section>

            <!-- PASOS VISUALES -->
            <section class="steps-container">
                <div class="step-card">
                    <div class="step-icon"><i class="pi pi-user-plus"></i></div>
                    <h3>Una sola persona</h3>
                    <p>Abre entrevistas y registrala en el momento.</p>
                    <a routerLink="/pages/entrevistas"><button pButton type="button" label="Ir ahora" icon="pi pi-arrow-right" size="small"></button></a>
                </div>
                <div class="step-connector"></div>
                <div class="step-card step-card--active">
                    <div class="step-icon"><i class="pi pi-users"></i></div>
                    <h3>Varias personas</h3>
                    <p>Descarga la plantilla o pega el listado completo.</p>
                </div>
                <div class="step-connector"></div>
                <div class="step-card">
                    <div class="step-icon"><i class="pi pi-check-circle"></i></div>
                    <h3>Preparar</h3>
                    <p>Guarda el listado y preparalo para entrevistas.</p>
                </div>
            </section>

            <!-- FORMULARIO DE CARGA -->
            <section class="card carga-section">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>{{ editingLoteId ? 'Editando listado' : 'Nuevo listado de personas' }}</h3>
                            <p>{{ editingLoteId ? 'Corrige el nombre o el contenido antes de guardar.' : 'Completa el nombre del listado y carga personas desde archivo o pegando datos.' }}</p>
                        </div>
                        <button pButton type="button" [label]="downloadingTemplate ? 'Descargando...' : 'Descargar plantilla'" icon="pi pi-file-excel"
                            severity="success" [outlined]="true" [disabled]="downloadingTemplate" (click)="downloadTemplate()"></button>
                    </div>
                </div>

                <div *ngIf="editingLoteId" class="cies-soft-note">
                    Estas editando un listado existente. Si cambias las personas, se reemplazara el contenido actual.
                </div>

                <!-- Paso 1: Nombre -->
                <div class="carga-paso">
                    <div class="carga-paso-header">
                        <span class="carga-paso-num">1</span>
                        <div>
                            <h4>Identifica el listado</h4>
                            <p>Usa un nombre que ayude a ubicar periodo, clinica o grupo.</p>
                        </div>
                    </div>
                    <input pInputText [(ngModel)]="nombreLote" class="w-full" placeholder="Ejemplo: Mujeres marzo - Clinica Central" />
                </div>

                <!-- Paso 2: Subir archivo o pegar datos -->
                <div class="carga-paso">
                    <div class="carga-paso-header">
                        <span class="carga-paso-num">2</span>
                        <div>
                            <h4>Agrega los datos de las personas</h4>
                            <p>La forma recomendada es usar la plantilla Excel. Tambien puedes pegar CSV o JSON.</p>
                        </div>
                    </div>

                    <div class="carga-input-grid">
                        <!-- Zona de subida de archivo -->
                        <div class="carga-method-card">
                            <div class="carga-method-head">
                                <i class="pi pi-file-excel"></i>
                                <div>
                                    <h5>Subir archivo</h5>
                                    <span>Excel recomendado</span>
                                </div>
                            </div>

                            <div
                                class="file-drop-zone"
                                [class.file-drop-zone--dragover]="isDragging"
                                [class.file-drop-zone--loaded]="archivoCargado"
                                (dragover)="onDragOver($event)"
                                (dragleave)="onDragLeave()"
                                (drop)="onDrop($event)"
                            >
                                <input
                                    #fileInput
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.json"
                                    class="file-input-hidden"
                                    (change)="onFileSelected($event)"
                                />

                                <div class="file-drop-content" *ngIf="!archivoCargado">
                                    <div class="file-drop-icon"><i class="pi pi-cloud-upload"></i></div>
                                    <div class="file-drop-title">Arrastra tu archivo aqui</div>
                                    <div class="file-drop-subtitle">o seleccionalo desde tu equipo</div>
                                    <button pButton type="button" [label]="loadingExcel ? 'Leyendo archivo...' : 'Elegir archivo'" severity="secondary" outlined [disabled]="loadingExcel" (click)="fileInput.click()"></button>
                                    <div class="file-drop-formats">
                                        <span class="format-badge">.XLSX</span>
                                        <span class="format-badge">.CSV</span>
                                        <span class="format-badge">.JSON</span>
                                    </div>
                                </div>

                                <div class="file-drop-content file-drop-content--loaded" *ngIf="archivoCargado">
                                    <div class="file-drop-icon"><i class="pi pi-check-circle"></i></div>
                                    <div class="file-drop-title">{{ archivoNombre }}</div>
                                    <button pButton type="button" label="Cambiar archivo" severity="secondary" text size="small" (click)="fileInput.click()"></button>
                                </div>
                            </div>
                        </div>

                        <!-- Textarea para pegar -->
                        <div class="carga-method-card">
                            <div class="carga-method-head">
                                <i class="pi pi-align-left"></i>
                                <div>
                                    <h5>Pegar datos</h5>
                                    <span>CSV o JSON</span>
                                </div>
                            </div>

                            <div class="carga-textarea-wrapper">
                                <textarea
                                    pTextarea
                                    [(ngModel)]="cargaMasiva"
                                    rows="12"
                                    class="w-full carga-textarea"
                                    placeholder="medicarePersonId,nombre,apellido,ci,pasaporte,clinica,regional,fechaConsulta,tipoConsulta&#10;MED-001,Maria,Lopez,1234567,,Clinica Central,La Paz,2026-03-29,PRIMERA_CONSULTA_SSR"
                                    (focus)="textareaFocused = true"
                                    (blur)="textareaFocused = false"
                                ></textarea>
                                <div class="carga-textarea-hint" [class.visible]="textareaFocused || !cargaMasiva">
                                    Pega aqui tu CSV o JSON
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Errores -->
                <div class="cies-note cies-note--warning" *ngIf="cargaError">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>{{ cargaError }}</span>
                </div>

                <!-- Columnas admitidas -->
                <div class="columnas-info">
                    <details open>
                        <summary>Columnas admitidas y recomendadas</summary>
                        <p>Obligatorias: clinica, regional y fechaConsulta. Para el nombre usa nombre + apellido o nombreCompleto.</p>
                        <div class="columnas-grid">
                            <span class="columna-tag">medicarePersonId</span>
                            <span class="columna-tag">nombre</span>
                            <span class="columna-tag">apellido</span>
                            <span class="columna-tag">nombreCompleto</span>
                            <span class="columna-tag">ci</span>
                            <span class="columna-tag">pasaporte</span>
                            <span class="columna-tag">documento</span>
                            <span class="columna-tag">clinica</span>
                            <span class="columna-tag">regional</span>
                            <span class="columna-tag">fechaConsulta</span>
                            <span class="columna-tag">tipoConsulta</span>
                        </div>
                    </details>
                </div>

                <!-- Botones de acción -->
                <div class="cies-actions-row">
                    <button pButton type="button" [label]="editingLoteId ? 'Guardar cambios' : 'Guardar listado'" icon="pi pi-upload" (click)="registrarLote()"></button>
                    <button pButton type="button" [label]="editingLoteId ? 'Cancelar' : 'Limpiar'" severity="secondary" [outlined]="true" icon="pi pi-eraser" (click)="limpiarCarga()"></button>
                </div>
            </section>

            <section class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Listados guardados</h3>
                            <p>Ahora están separados por estado para que no mezcles lo que falta preparar con lo que ya está listo.</p>
                        </div>
                        <app-cies-info-hint text="Cada listado conserva responsable, fecha y total de personas para trazabilidad."></app-cies-info-hint>
                    </div>
                </div>

                <div *ngIf="!hasLotes" class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <h3>Aún no registraste ningún listado</h3>
                    <p>Si tienes varias personas, pega el contenido arriba y pulsa <strong>Guardar listado</strong>. Si solo tienes una, entra directo a entrevistas y regístrala allí mismo.</p>
                    <div class="cies-empty-state__actions">
                        <a routerLink="/pages/entrevistas"><button pButton type="button" label="Entrevistar a una sola persona" severity="secondary" [outlined]="true"></button></a>
                    </div>
                </div>

                <div *ngIf="lotesPendientes.length" class="cies-stack">
                    <div class="cies-section-head">
                        <div>
                            <h3>Listados por preparar</h3>
                            <p>Estos todavía no pasaron a la bandeja de entrevistas.</p>
                        </div>
                    </div>

                    <p-table [value]="lotesPendientes" [tableStyle]="{ 'min-width': '72rem' }" responsiveLayout="scroll"
                        [paginator]="true" [lazy]="true" [rows]="lotesPendientesRows"
                        [first]="lotesPendientesPage * lotesPendientesRows" [totalRecords]="totalLotesPendientes"
                        [rowsPerPageOptions]="[5, 10, 20]" [loading]="loadingLotesPendientes"
                        (onLazyLoad)="onLotesPendientesLazyLoad($any($event))" class="cies-table">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Estado</th>
                                <th>Total</th>
                                <th>Creado por</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-item>
                            <tr>
                                <td>#{{ item.id }}</td>
                                <td class="font-medium">{{ item.nombre }}</td>
                                <td><p-tag [value]="item.estado | estadoTexto" severity="warn"></p-tag></td>
                                <td>{{ item.totalPersonas }}</td>
                                <td class="text-muted">{{ item.creadoPor }}</td>
                                <td class="text-muted">{{ item.fechaCreacion | fechaCorta }}</td>
                                <td>
                                    <div class="cies-inline-actions">
                                        <button pButton type="button" label="Preparar" icon="pi pi-play" size="small" (click)="ejecutar(item)"></button>
                                        <button pButton type="button" icon="pi pi-pencil" text rounded severity="info" (click)="editarLote(item)"></button>
                                        <button pButton type="button" icon="pi pi-trash" text rounded severity="danger" (click)="eliminarLote(item)"></button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

                <div *ngIf="lotesProcesados.length" class="cies-stack">
                    <div class="cies-section-head">
                        <div>
                            <h3>Listados ya preparados</h3>
                            <p>Estas personas ya fueron enviadas a la bandeja de entrevistas.</p>
                        </div>
                    </div>

                    <p-table [value]="lotesProcesados" [tableStyle]="{ 'min-width': '62rem' }" responsiveLayout="scroll"
                        [paginator]="true" [lazy]="true" [rows]="lotesProcesadosRows"
                        [first]="lotesProcesadosPage * lotesProcesadosRows" [totalRecords]="totalLotesProcesados"
                        [rowsPerPageOptions]="[5, 10, 20]" [loading]="loadingLotesProcesados"
                        (onLazyLoad)="onLotesProcesadosLazyLoad($any($event))" class="cies-table">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Estado</th>
                                <th>Total</th>
                                <th>Creado por</th>
                                <th>Fecha</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-item>
                            <tr>
                                <td>#{{ item.id }}</td>
                                <td class="font-medium">{{ item.nombre }}</td>
                                <td><p-tag [value]="item.estado | estadoTexto" severity="success"></p-tag></td>
                                <td>{{ item.totalPersonas }}</td>
                                <td class="text-muted">{{ item.creadoPor }}</td>
                                <td class="text-muted">{{ item.fechaCreacion | fechaCorta }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </section>

            <section class="card" *ngIf="ejecuciones.length">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Selecciones recientes</h3>
                            <p>Quién ejecutó la selección y cuántas personas quedaron listas.</p>
                        </div>
                        <app-cies-info-hint text="La semilla registrada permite repetir y auditar el proceso de selección cuando sea necesario."></app-cies-info-hint>
                    </div>
                </div>

                <p-table [value]="ejecuciones" [tableStyle]="{ 'min-width': '58rem' }" responsiveLayout="scroll"
                    [paginator]="true" [lazy]="true" [rows]="ejecucionesRows"
                    [first]="ejecucionesPage * ejecucionesRows" [totalRecords]="totalEjecuciones"
                    [rowsPerPageOptions]="[5, 10, 20]" [loading]="loadingEjecuciones"
                    (onLazyLoad)="onEjecucionesLazyLoad($any($event))" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Listado</th>
                            <th>Semilla</th>
                            <th>Seleccionadas</th>
                            <th>Ejecutado por</th>
                            <th>Fecha</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td class="font-medium">#{{ item.loteId }}</td>
                            <td class="font-mono text-sm">{{ item.semilla }}</td>
                            <td>{{ item.totalSeleccionadas }}</td>
                            <td class="text-muted">{{ item.ejecutadoPor }}</td>
                            <td class="text-muted">{{ item.fechaEjecucion | fechaCorta }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>

        <p-toast></p-toast>
    `,
    styles: [
        `
            .steps-container {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 2.5rem minmax(0, 1fr) 2.5rem minmax(0, 1fr);
                align-items: stretch;
                gap: 0;
            }

            .step-card {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 0.55rem;
                padding: 1rem;
                background: var(--layout-panel-background);
                border: 1px solid var(--layout-border-soft);
                border-radius: 0.75rem;
                box-shadow: var(--layout-shadow-soft);
                transition: all 0.2s ease;
            }

            .step-card--active {
                border-color: color-mix(in srgb, var(--primary-color) 55%, var(--layout-border-soft));
                background: color-mix(in srgb, var(--primary-color) 8%, var(--layout-panel-background));
            }

            .step-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 2.4rem;
                height: 2.4rem;
                border-radius: 999px;
                background: color-mix(in srgb, var(--primary-color) 12%, transparent);
                color: var(--primary-color);
                font-size: 1.1rem;
            }

            .step-card h3 {
                margin: 0 0 0.25rem;
                font-size: 0.95rem;
                color: var(--text-color);
            }

            .step-card p {
                margin: 0;
                font-size: 0.82rem;
                color: var(--text-color-secondary);
                line-height: 1.4;
            }

            .step-connector {
                height: 2px;
                background: var(--surface-border);
                align-self: center;
            }

            .carga-section {
                scroll-margin-top: 6rem;
            }

            .carga-paso {
                margin-bottom: 1.25rem;
            }

            .carga-paso-header {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                margin-bottom: 0.75rem;
            }

            .carga-paso-num {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1.75rem;
                height: 1.75rem;
                border-radius: 50%;
                background: var(--primary-color);
                color: var(--primary-color-text);
                font-size: 0.8rem;
                font-weight: 700;
                flex-shrink: 0;
            }

            .carga-paso-header h4 {
                margin: 0;
                font-size: 0.95rem;
            }

            .carga-paso-header p {
                margin: 0.2rem 0 0;
                color: var(--text-color-secondary);
                font-size: 0.85rem;
                line-height: 1.4;
            }

            .carga-input-grid {
                display: grid;
                grid-template-columns: minmax(18rem, 0.9fr) minmax(0, 1.1fr);
                gap: 1rem;
                align-items: stretch;
            }

            .carga-method-card {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 0.85rem;
                padding: 1rem;
                border: 1px solid var(--layout-border-soft);
                border-radius: 0.75rem;
                background: color-mix(in srgb, var(--surface-card) 82%, var(--surface-ground));
            }

            .carga-method-head {
                display: flex;
                align-items: center;
                gap: 0.65rem;
            }

            .carga-method-head > i {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 2.25rem;
                height: 2.25rem;
                border-radius: 999px;
                color: var(--primary-color);
                background: color-mix(in srgb, var(--primary-color) 12%, transparent);
            }

            .carga-method-head h5 {
                margin: 0;
                font-size: 0.95rem;
            }

            .carga-method-head span {
                color: var(--text-color-secondary);
                font-size: 0.8rem;
            }

            .file-drop-zone {
                border: 2px dashed var(--surface-border);
                border-radius: 0.75rem;
                padding: 1.5rem;
                text-align: center;
                transition: all 0.25s ease;
                background: var(--surface-ground);
                cursor: pointer;
                position: relative;
            }

            .file-drop-zone:hover {
                border-color: var(--primary-color);
                background: color-mix(in srgb, var(--primary-color) 5%, var(--surface-ground));
            }

            .file-drop-zone--dragover {
                border-color: var(--primary-color);
                background: color-mix(in srgb, var(--primary-color) 8%, var(--surface-ground));
                transform: scale(1.01);
            }

            .file-drop-zone--loaded {
                border-style: solid;
                border-color: #22c55e;
                background: rgba(34, 197, 94, 0.06);
            }

            .file-input-hidden {
                display: none;
            }

            .file-drop-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }

            .file-drop-icon {
                color: var(--primary-color);
                font-size: 2.5rem;
                line-height: 1;
            }

            .file-drop-title {
                font-size: 1.05rem;
                font-weight: 600;
                color: var(--text-color);
            }

            .file-drop-subtitle {
                font-size: 0.85rem;
                color: var(--text-color-secondary);
            }

            .file-drop-formats {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.25rem;
            }

            .format-badge {
                display: inline-block;
                padding: 0.2rem 0.6rem;
                border-radius: 0.4rem;
                background: var(--surface-card);
                border: 1px solid var(--surface-border);
                font-size: 0.75rem;
                font-weight: 600;
                font-family: monospace;
                color: var(--text-color-secondary);
            }

            .carga-separador {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin: 1.25rem 0;
                color: var(--text-color-secondary);
                font-size: 0.85rem;
            }

            .carga-separador::before,
            .carga-separador::after {
                content: '';
                flex: 1;
                height: 1px;
                background: var(--surface-border);
            }

            .carga-textarea-wrapper {
                position: relative;
                height: 100%;
            }

            .carga-textarea {
                min-height: 16rem;
                height: 100%;
                font-family: 'Courier New', monospace;
                font-size: 0.85rem;
                line-height: 1.5;
                border-radius: 0.65rem;
                border: 2px solid var(--surface-border);
                transition: border-color 0.2s ease;
                resize: vertical;
            }

            .carga-textarea:focus {
                border-color: var(--primary-color);
            }

            .carga-textarea-hint {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: var(--text-color);
                font-size: 0.88rem;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                background: rgba(15, 23, 42, 0.08);
                padding: 0.45rem 0.75rem;
                border-radius: 999px;
            }

            .carga-textarea-hint.visible {
                opacity: 1;
            }

            .columnas-info {
                margin-top: 1rem;
            }

            .columnas-info details {
                background: var(--surface-ground);
                border: 1px solid var(--surface-border);
                border-radius: 0.75rem;
                padding: 0.75rem 1rem;
            }

            .columnas-info summary {
                cursor: pointer;
                font-size: 0.88rem;
                color: var(--text-color-secondary);
                user-select: none;
            }

            .columnas-info p {
                margin: 0.65rem 0 0;
                color: var(--text-color-secondary);
                font-size: 0.85rem;
                line-height: 1.45;
            }

            .columnas-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4rem;
                margin-top: 0.75rem;
            }

            .columna-tag {
                display: inline-block;
                padding: 0.2rem 0.5rem;
                border-radius: 0.4rem;
                background: var(--surface-card);
                border: 1px solid var(--surface-border);
                font-size: 0.75rem;
                font-family: monospace;
                color: var(--text-color);
            }

            .cies-actions-row {
                display: flex;
                gap: 0.5rem;
                margin-top: 1.5rem;
                justify-content: flex-end;
            }

            @media (max-width: 768px) {
                .steps-container {
                    grid-template-columns: 1fr;
                    gap: 0.5rem;
                }

                .step-connector {
                    display: none;
                }

                .step-card {
                    text-align: left;
                    display: grid;
                    grid-template-columns: auto minmax(0, 1fr);
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                }

                .step-card a {
                    grid-column: 2;
                }

                .step-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0;
                }

                .step-card h3 {
                    margin: 0;
                    font-size: 0.9rem;
                }

                .step-card p {
                    margin: 0;
                    font-size: 0.8rem;
                }

                .file-drop-zone {
                    padding: 1.5rem 1rem;
                }

                .carga-input-grid {
                    grid-template-columns: 1fr;
                }

                .cies-actions-row {
                    flex-direction: column;
                }

                .cies-actions-row button {
                    width: 100%;
                }

                .file-drop-icon {
                    font-size: 2rem;
                }
            }
        `
    ]
})
export class SeleccionPage implements OnInit {
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);

    editingLoteId: number | null = null;
    nombreLote = '';
    cargaMasiva = '';
    cargaError = '';
    lotesPendientes: LoteMedicare[] = [];
    lotesProcesados: LoteMedicare[] = [];
    ejecuciones: EjecucionSeleccion[] = [];
    totalLotesPendientes = 0;
    totalLotesProcesados = 0;
    totalEjecuciones = 0;
    lotesPendientesPage = 0;
    lotesProcesadosPage = 0;
    ejecucionesPage = 0;
    lotesPendientesRows = 5;
    lotesProcesadosRows = 5;
    ejecucionesRows = 5;
    loadingLotesPendientes = false;
    loadingLotesProcesados = false;
    loadingEjecuciones = false;

    isDragging = false;
    archivoCargado = false;
    archivoNombre = '';
    textareaFocused = false;
    downloadingTemplate = false;
    loadingExcel = false;

    ngOnInit(): void {
        this.load();
    }

    get hasLotes(): boolean {
        return this.totalLotesPendientes + this.totalLotesProcesados > 0;
    }

    load(): void {
        this.loadLotesPendientes();
        this.loadLotesProcesados();
        this.loadEjecuciones();
    }

    loadLotesPendientes(page = this.lotesPendientesPage, size = this.lotesPendientesRows): void {
        this.loadingLotesPendientes = true;
        this.ciesService.listLotesPaginado(page, size, 'PENDIENTES').subscribe({
            next: (response) => {
                if (!response.content.length && response.totalElements > 0 && page > 0) {
                    this.loadLotesPendientes(page - 1, size);
                    return;
                }

                this.lotesPendientes = response.content;
                this.totalLotesPendientes = response.totalElements;
                this.lotesPendientesPage = response.page;
                this.lotesPendientesRows = response.size;
                this.loadingLotesPendientes = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.loadingLotesPendientes = false;
                console.error('Error loading lotes:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los lotes' });
            }
        });
    }

    loadLotesProcesados(page = this.lotesProcesadosPage, size = this.lotesProcesadosRows): void {
        this.loadingLotesProcesados = true;
        this.ciesService.listLotesPaginado(page, size, 'PROCESADO').subscribe({
            next: (response) => {
                if (!response.content.length && response.totalElements > 0 && page > 0) {
                    this.loadLotesProcesados(page - 1, size);
                    return;
                }

                this.lotesProcesados = response.content;
                this.totalLotesProcesados = response.totalElements;
                this.lotesProcesadosPage = response.page;
                this.lotesProcesadosRows = response.size;
                this.loadingLotesProcesados = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.loadingLotesProcesados = false;
                console.error('Error loading lotes procesados:', error);
            }
        });
    }

    loadEjecuciones(page = this.ejecucionesPage, size = this.ejecucionesRows): void {
        this.loadingEjecuciones = true;
        this.ciesService.listEjecucionesPaginado(page, size).subscribe({
            next: (response) => {
                if (!response.content.length && response.totalElements > 0 && page > 0) {
                    this.loadEjecuciones(page - 1, size);
                    return;
                }

                this.ejecuciones = response.content;
                this.totalEjecuciones = response.totalElements;
                this.ejecucionesPage = response.page;
                this.ejecucionesRows = response.size;
                this.loadingEjecuciones = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.loadingEjecuciones = false;
                console.error('Error loading ejecuciones:', error);
            }
        });
    }

    onLotesPendientesLazyLoad(event: { first?: number; rows?: number }): void {
        const rows = event.rows || this.lotesPendientesRows;
        const page = Math.floor((event.first || 0) / rows);
        this.loadLotesPendientes(page, rows);
    }

    onLotesProcesadosLazyLoad(event: { first?: number; rows?: number }): void {
        const rows = event.rows || this.lotesProcesadosRows;
        const page = Math.floor((event.first || 0) / rows);
        this.loadLotesProcesados(page, rows);
    }

    onEjecucionesLazyLoad(event: { first?: number; rows?: number }): void {
        const rows = event.rows || this.ejecucionesRows;
        const page = Math.floor((event.first || 0) / rows);
        this.loadEjecuciones(page, rows);
    }

    downloadTemplate(): void {
        if (this.downloadingTemplate) return;

        this.downloadingTemplate = true;
        this.ciesService.downloadPlantillaPersonas().subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'plantilla-personas-cies.xlsx';
                link.click();
                window.URL.revokeObjectURL(url);
                this.downloadingTemplate = false;
            },
            error: (error) => {
                this.downloadingTemplate = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(error, 'No se pudo descargar la plantilla')
                });
            }
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        this.processSelectedFile(file);
        input.value = '';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(): void {
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const file = event.dataTransfer?.files?.[0];
        if (!file) return;

        this.processSelectedFile(file);
    }

    private processSelectedFile(file: File): void {
        const validTypes = ['text/csv', 'application/json', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!validTypes.includes(file.type) && !['csv', 'json', 'xlsx', 'xls'].includes(ext || '')) {
            this.cargaError = 'Solo se aceptan archivos .xlsx, .csv o .json';
            this.cdr.detectChanges();
            return;
        }

        this.archivoNombre = file.name;
        this.archivoCargado = true;

        if (ext === 'xlsx' || ext === 'xls') {
            this.loadingExcel = true;
            this.ciesService.leerPlantillaPersonas(file).subscribe({
                next: (personas) => {
                    this.cargaMasiva = JSON.stringify(personas, null, 2);
                    this.cargaError = '';
                    this.loadingExcel = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Excel leído',
                        detail: `Se cargaron ${personas.length} persona${personas.length === 1 ? '' : 's'} desde la plantilla.`
                    });
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.cargaError = this.extractErrorMessage(error, 'No se pudo leer la plantilla Excel');
                    this.archivoCargado = false;
                    this.archivoNombre = '';
                    this.loadingExcel = false;
                    this.cdr.detectChanges();
                }
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.cargaMasiva = String(reader.result || '');
            this.cargaError = '';
            this.cdr.detectChanges();
        };
        reader.readAsText(file);
    }

    registrarLote(): void {
        if (!this.nombreLote) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre del listado es obligatorio' });
            return;
        }

        try {
            const personas = this.parseCargaMasiva();
            const request$ = this.editingLoteId ? this.ciesService.updateLote(this.editingLoteId, this.nombreLote, personas) : this.ciesService.createLote(this.nombreLote, personas);

            request$.subscribe({
                next: () => {
                    this.limpiarCarga();
                    this.load();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: this.editingLoteId ? 'Listado actualizado correctamente' : 'Listado registrado correctamente'
                    });
                },
                error: (error) => {
                    console.error('Error registering batch:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: this.extractErrorMessage(error, 'No se pudo registrar el listado')
                    });
                }
            });
        } catch (error) {
            this.cargaError = error instanceof Error ? error.message : 'No se pudo interpretar el listado cargado.';
            this.cdr.detectChanges();
        }
    }

    limpiarCarga(): void {
        this.editingLoteId = null;
        this.nombreLote = '';
        this.cargaMasiva = '';
        this.cargaError = '';
        this.isDragging = false;
        this.archivoCargado = false;
        this.archivoNombre = '';
        this.textareaFocused = false;
        this.loadingExcel = false;
        this.cdr.detectChanges();
    }

    ejecutar(item: LoteMedicare): void {
        this.cargaError = '';
        this.ciesService.executeSeleccion(item.id).subscribe({
            next: () => {
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Selección ejecutada',
                    detail: 'Proceso de selección aleatoria completado'
                });
            },
            error: (error) => {
                console.error('Error executing selection:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo ejecutar la selección' });
            }
        });
    }

    editarLote(item: LoteMedicare): void {
        this.editingLoteId = item.id;
        this.nombreLote = item.nombre;
        this.cargaMasiva = JSON.stringify(
            item.personas.map((persona) => ({
                medicarePersonId: persona.medicarePersonId,
                nombreCompleto: persona.nombreCompleto,
                documento: persona.documento || '',
                clinica: persona.clinica,
                regional: persona.regional,
                fechaConsulta: persona.fechaConsulta,
                tipoConsulta: persona.tipoConsulta
            })),
            null,
            2
        );
        this.cargaError = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.cdr.detectChanges();
    }

    eliminarLote(item: LoteMedicare): void {
        if (!window.confirm(`Se eliminará el listado ${item.nombre}. Esta acción solo debe usarse si el listado aún no fue preparado. ¿Deseas continuar?`)) {
            return;
        }

        this.ciesService.deleteLote(item.id).subscribe({
            next: () => {
                if (this.editingLoteId === item.id) {
                    this.limpiarCarga();
                }
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Eliminado',
                    detail: `Listado ${item.nombre} eliminado correctamente`
                });
            },
            error: (error) => {
                console.error('Error deleting batch:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el listado' });
            }
        });
    }

    private parseCargaMasiva(): Array<Record<string, unknown>> {
        const raw = this.cargaMasiva.trim();
        if (!raw) {
            throw new Error('Debes pegar o cargar un archivo con personas elegibles.');
        }

        const parsed = raw.startsWith('[') || raw.startsWith('{') ? this.parseJson(raw) : this.parseCsv(raw);
        const personas = parsed
            .map((item) => this.normalizePersona(item))
            .filter((item) => item['clinica'] && item['regional'] && item['fechaConsulta']);

        if (!personas.length) {
            throw new Error('No se encontraron registros válidos. Revisa columnas y formato del archivo.');
        }

        return personas;
    }

    private parseJson(raw: string): Array<Record<string, unknown>> {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
            return parsed.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
        }

        if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { personas?: unknown[] }).personas)) {
            return ((parsed as { personas: unknown[] }).personas).filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
        }

        throw new Error('El JSON debe ser un arreglo de personas o un objeto con la propiedad personas.');
    }

    private parseCsv(raw: string): Array<Record<string, unknown>> {
        const lines = raw
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length < 2) {
            throw new Error('El CSV debe incluir una fila de encabezados y al menos una persona.');
        }

        const headers = this.splitCsvLine(lines[0]).map((item) => this.normalizeHeader(item));
        return lines.slice(1).map((line) => {
            const values = this.splitCsvLine(line);
            const row: Record<string, unknown> = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ?? '';
            });
            return row;
        });
    }

    private splitCsvLine(line: string): string[] {
        const values: string[] = [];
        let current = '';
        let insideQuotes = false;

        for (let index = 0; index < line.length; index++) {
            const char = line[index];

            if (char === '"') {
                if (insideQuotes && line[index + 1] === '"') {
                    current += '"';
                    index++;
                } else {
                    insideQuotes = !insideQuotes;
                }
                continue;
            }

            if (char === ',' && !insideQuotes) {
                values.push(current.trim());
                current = '';
                continue;
            }

            current += char;
        }

        values.push(current.trim());
        return values;
    }

    private normalizePersona(item: Record<string, unknown>): Record<string, unknown> {
        return {
            medicarePersonId: this.readValue(item, ['medicarePersonId', 'medicarepersonid', 'personid', 'id']),
            nombre: this.readValue(item, ['nombre']),
            apellido: this.readValue(item, ['apellido']),
            nombreCompleto: this.readValue(item, ['nombreCompleto', 'nombrecompleto']),
            ci: this.readValue(item, ['ci', 'carnet']),
            pasaporte: this.readValue(item, ['pasaporte']),
            documento: this.readValue(item, ['documento']),
            clinica: this.readValue(item, ['clinica']),
            regional: this.readValue(item, ['regional']),
            fechaConsulta: this.readValue(item, ['fechaConsulta', 'fechaconsulta']) || this.todayLocalIsoDate(),
            tipoConsulta: this.readValue(item, ['tipoConsulta', 'tipoconsulta']) || 'PRIMERA_CONSULTA_SSR'
        };
    }

    private todayLocalIsoDate(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private readValue(item: Record<string, unknown>, keys: string[]): string {
        for (const key of keys) {
            const match = Object.keys(item).find((existing) => this.normalizeHeader(existing) === this.normalizeHeader(key));
            if (match) {
                const value = String(item[match] ?? '').trim();
                if (value) {
                    return value;
                }
            }
        }
        return '';
    }

    private normalizeHeader(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }

    private extractErrorMessage(error: unknown, fallback: string): string {
        const payload = error as {
            error?: { message?: string; detail?: string; error?: string } | string;
            message?: string;
        } | null;

        const errorBody = payload?.error;
        if (typeof errorBody === 'string') {
            return errorBody;
        }

        return errorBody?.message
            || errorBody?.detail
            || errorBody?.error
            || payload?.message
            || fallback;
    }
}
