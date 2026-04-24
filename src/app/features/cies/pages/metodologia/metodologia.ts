import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { AccordionModule } from 'primeng/accordion';
import { Toast } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, Metodologia, MetodologiaComparativo } from '../../services/cies.service';

interface PreguntaEdit {
    id: number;
    orden: number;
    numeroVisible: number;
    codigoVariable: string;
    tipo: string;
    seccion: string;
    etiqueta: string;
    obligatoria: boolean;
    metadato: boolean;
    ponderacion: number;
    opciones: { id: number; orden: number; codigo: string; etiqueta: string; valorNumerico: number }[];
}

interface CreateMetodologiaForm {
    nombre: string;
    descripcion: string;
    comentarioCambio: string;
    templateId: number | null;
}

@Component({
    selector: 'app-metodologia-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, TableModule, TagModule, TextareaModule, AccordionModule, Toast, TabsModule, SelectModule, CiesInfoHintComponent],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--verde">Configuración</div>
                    <h1 class="cies-hero__title">Ajustar puntajes y clasificación</h1>
                    <p class="cies-hero__copy">Aquí defines cuánto vale cada respuesta y en qué punto una persona se clasifica como vulnerable. Estos valores se usan para calcular el resultado de las entrevistas.</p>
                </div>
            </section>

            <section class="card" *ngIf="metodologias.length">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Administrar encuestas</h3>
                            <p>Selecciona la encuesta que quieres revisar, editar, activar o usar como plantilla.</p>
                        </div>
                        <app-cies-info-hint text="La nueva encuesta toma por defecto la plantilla actualmente activa, pero puedes cambiarla desde el dropdown."></app-cies-info-hint>
                    </div>
                </div>

                <div class="crud-toolbar">
                    <div class="crud-toolbar__selector">
                        <label>Encuesta seleccionada</label>
                        <p-select [options]="metodologiaOptions" [(ngModel)]="selectedMetodologiaId"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Selecciona una encuesta" (ngModelChange)="selectMetodologia($event)"></p-select>
                    </div>

                    <div class="crud-toolbar__actions" *ngIf="canEditConfiguration">
                        <button pButton type="button" label="Nueva encuesta" icon="pi pi-plus"
                            [disabled]="isBusy" (click)="openCreateDialog()"></button>
                        <button pButton type="button" [label]="activating ? 'Activando...' : 'Usar en el sistema'" icon="pi pi-check-circle"
                            severity="success" [outlined]="true" [disabled]="isBusy"
                            *ngIf="active && !active.activa" (click)="activateSelected()"></button>
                        <button pButton type="button" [label]="deleting ? 'Eliminando...' : 'Eliminar'" icon="pi pi-trash"
                            severity="danger" [outlined]="true" [disabled]="isBusy"
                            *ngIf="active && !active.activa" (click)="deleteSelected()"></button>
                    </div>
                </div>
            </section>

            <!-- TARJETA PRINCIPAL: Configuración actual -->
            <section class="card" *ngIf="active">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>📋 Encuesta seleccionada: {{ active.nombre }}</h3>
                            <p>Estos son los valores y preguntas de la encuesta que tienes abierta en pantalla.</p>
                        </div>
                        <app-cies-info-hint text="Si necesitas ajustar algo, pulsa 'Editar configuración' abajo."></app-cies-info-hint>
                    </div>
                </div>

                <div class="selected-survey-head">
                    <p-tag *ngIf="active.activa" value="Activa en el sistema" severity="success"></p-tag>
                    <p-tag *ngIf="!active.activa" value="Versión en borrador" severity="warn"></p-tag>
                    <span class="selected-survey-meta">Creada por {{ active.creadoPor || 'sistema' }} · {{ active.fechaCreacion | date:'short' }}</span>
                </div>

                <!-- Puntos de corte -->
                <div class="config-summary-grid">
                    <div class="config-card config-card--pobre">
                        <div class="config-card-label">
                            <span class="config-card-dot config-card-dot--pobre"></span>
                            Punto de corte «Vulnerable»
                        </div>
                        <div class="config-card-value">{{ active.umbralPobre }} <small>puntos o menos</small></div>
                    </div>
                    <div class="config-card config-card--excluido">
                        <div class="config-card-label">
                            <span class="config-card-dot config-card-dot--excluido"></span>
                            Punto de corte «Excluido»
                        </div>
                        <div class="config-card-value">{{ active.umbralExcluido }} <small>puntos o menos</small></div>
                    </div>
                    <div class="config-card config-card--subatendido">
                        <div class="config-card-label">
                            <span class="config-card-dot config-card-dot--subatendido"></span>
                            Punto de corte «Subatendido»
                        </div>
                        <div class="config-card-value">{{ active.umbralSubatendido }} <small>puntos o menos</small></div>
                    </div>
                </div>

                <!-- Explicación de puntos de corte -->
                <div class="config-explanation">
                    <h4>¿Qué significa cada punto de corte?</h4>
                    <ul>
                        <li><strong>Vulnerable:</strong> Si el puntaje total es <strong>{{ active.umbralPobre }} o menos</strong>, la persona se clasifica como vulnerable.</li>
                        <li><strong>Excluido:</strong> Si el puntaje es <strong>{{ active.umbralExcluido }} o menos</strong>, se considera en situación de exclusión.</li>
                        <li><strong>Subatendido:</strong> Si el puntaje es <strong>{{ active.umbralSubatendido }} o menos</strong>, se marca como subatendido.</li>
                    </ul>
                </div>

                <!-- Preguntas desplegables -->
                <p-accordion [multiple]="true">
                    @for (section of preguntasPorSeccion(); track section.seccion) {
                        <p-accordion-panel>
                            <ng-template pTemplate="header">
                                <div class="accordion-header">
                                    <span class="accordion-section-icon">{{ sectionIcon(section.seccion) }}</span>
                                    <strong>{{ section.seccion }}</strong>
                                    <span class="accordion-count">{{ section.preguntas.length }} pregunta{{ section.preguntas.length > 1 ? 's' : '' }}</span>
                                </div>
                            </ng-template>
                            <ng-template pTemplate="content">
                                <div class="pregunta-list">
                                    @for (q of section.preguntas; track q.id) {
                                        <div class="pregunta-row" [class.pregunta-metadato]="q.metadato">
                                            <div class="pregunta-info">
                                                <span class="pregunta-num">{{ q.numeroVisible }}</span>
                                                <div>
                                                    <div class="pregunta-label">{{ q.etiqueta }}</div>
                                                    <div class="pregunta-sub" *ngIf="q.metadato">No suma puntos · solo registra datos</div>
                                                </div>
                                            </div>
                                            <div class="pregunta-ponderacion" *ngIf="!q.metadato">
                                                <span class="ponderacion-badge">Importancia: {{ q.ponderacion }}%</span>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </ng-template>
                        </p-accordion-panel>
                    }
                </p-accordion>

                <div class="cies-actions-row">
                    <button *ngIf="canEditConfiguration" pButton type="button" label="Editar configuración" icon="pi pi-pencil" [disabled]="isBusy" (click)="openEdit(active)"></button>
                    <button pButton type="button" label="Comparar versiones" icon="pi pi-clone" severity="secondary" [outlined]="true" [disabled]="isBusy" (click)="openComparativo()"></button>
                    <button *ngIf="canEditConfiguration" pButton type="button" [label]="duplicating ? 'Duplicando...' : 'Duplicar versión'" icon="pi pi-copy" severity="info" [outlined]="true" [disabled]="isBusy" (click)="duplicateVersion()"></button>
                </div>

                <div class="cies-soft-note" *ngIf="!canEditConfiguration">
                    Puedes revisar esta configuración, pero solo un administrador puede editarla.
                </div>
            </section>

            <section class="card" *ngIf="!active">
                <div class="cies-empty-state">
                    <div class="cies-empty-state__icon"><i class="pi pi-sliders-h"></i></div>
                    <h3>No hay configuración activa</h3>
                    <p>El sistema necesita una configuración base para funcionar.</p>
                </div>
            </section>
        </div>

        <p-toast></p-toast>

        <p-dialog [(visible)]="showComparativo" [modal]="true" [style]="{ width: '64rem', 'max-width': '96vw' }"
            [draggable]="false" [resizable]="false" header="Comparar versiones" styleClass="cies-dialog">
            <div class="comparativo-selector">
                <p>Selecciona dos versiones para comparar sus configuraciones.</p>
                <div class="comparativo-selectors-row">
                    <div>
                        <label>Versión 1</label>
                        <p-select [options]="metodologias" [(ngModel)]="comparativoVersion1"
                            optionLabel="nombre" optionValue="id" appendTo="body" class="w-full"
                            placeholder="Selecciona..."></p-select>
                    </div>
                    <div>
                        <label>Versión 2</label>
                        <p-select [options]="metodologias" [(ngModel)]="comparativoVersion2"
                            optionLabel="nombre" optionValue="id" appendTo="body" class="w-full"
                            placeholder="Selecciona..."></p-select>
                    </div>
                    <div class="comparativo-btn-wrapper">
                        <button pButton type="button" label="Comparar" icon="pi pi-clone"
                            [disabled]="loadingComparativo || !comparativoVersion1 || !comparativoVersion2"
                            (click)="loadComparativo()"></button>
                    </div>
                </div>
            </div>

            <div *ngIf="comparativoData.length === 2" class="comparativo-grid">
                <div class="comparativo-col" *ngFor="let item of comparativoData; let i = index">
                    <h4 class="comparativo-col-title">
                        <span class="version-badge">v{{ i + 1 }}</span>
                        {{ item.nombre }}
                        <p-tag *ngIf="item.id === activeMetodologiaId" value="Activa" severity="success" styleClass="ml-2"></p-tag>
                    </h4>
                    <div class="comparativo-stat">
                        <span class="stat-label">Umbral Vulnerable</span>
                        <span class="stat-value">{{ item.umbralPobre }}</span>
                    </div>
                    <div class="comparativo-stat">
                        <span class="stat-label">Umbral Excluido</span>
                        <span class="stat-value">{{ item.umbralExcluido }}</span>
                    </div>
                    <div class="comparativo-stat">
                        <span class="stat-label">Umbral Subatendido</span>
                        <span class="stat-value">{{ item.umbralSubatendido }}</span>
                    </div>
                    <div class="comparativo-stat">
                        <span class="stat-label">Preguntas</span>
                        <span class="stat-value">{{ item.cantidadPreguntas }}</span>
                    </div>
                    <div class="comparativo-stat">
                        <span class="stat-label">Opciones</span>
                        <span class="stat-value">{{ item.cantidadOpciones }}</span>
                    </div>
                    <div class="comparativo-stat">
                        <span class="stat-label">Con ponderación</span>
                        <span class="stat-value">{{ item.preguntasConPonderacion }}</span>
                    </div>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cerrar" severity="secondary" [outlined]="true"
                    (click)="showComparativo = false"></button>
            </ng-template>
        </p-dialog>

        <p-dialog
            [(visible)]="showCreateDialog"
            [modal]="true"
            [style]="{ width: '40rem', 'max-width': '96vw' }"
            [draggable]="false"
            [resizable]="false"
            header="Crear nueva encuesta"
            styleClass="cies-dialog"
        >
            <div class="cies-dialog-content create-dialog-content">
                <p class="dialog-intro">
                    Crea una nueva encuesta a partir de una plantilla existente. Por defecto se usará la encuesta activa del sistema.
                </p>

                <div class="config-summary-grid">
                    <div>
                        <label>Nombre de la nueva encuesta</label>
                        <input pInputText [(ngModel)]="createForm.nombre" class="w-full"
                            placeholder="Ejemplo: CIES v2 - Piloto julio" />
                    </div>
                    <div>
                        <label>Plantilla base</label>
                        <p-select [options]="metodologiaOptions" [(ngModel)]="createForm.templateId"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Selecciona una plantilla"></p-select>
                        <small class="field-help">La plantilla actual del sistema aparece seleccionada por defecto.</small>
                    </div>
                </div>

                <div class="editor-section">
                    <label>Descripción</label>
                    <textarea pTextarea [(ngModel)]="createForm.descripcion" rows="3" class="w-full"
                        placeholder="Describe para qué servirá esta nueva encuesta."></textarea>
                </div>

                <div class="editor-section editor-section--comentario">
                    <label>Comentario del cambio</label>
                    <textarea pTextarea [(ngModel)]="createForm.comentarioCambio" rows="2" class="w-full"
                        placeholder="Ejemplo: Nueva versión para piloto regional y ajuste de clasificación."></textarea>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true"
                    [disabled]="creatingSurvey" (click)="closeCreateDialog()"></button>
                <button pButton type="button" [label]="creatingSurvey ? 'Creando...' : 'Crear encuesta'" icon="pi pi-check"
                    [disabled]="creatingSurvey"
                    (click)="createSurvey()"></button>
            </ng-template>
        </p-dialog>

        <!-- DIALOG DE EDICIÓN -->
        <p-dialog
            [(visible)]="showEditor"
            [modal]="true"
            [style]="{ width: '72rem', 'max-width': '98vw' }"
            [draggable]="false"
            [resizable]="false"
            header="Editar configuración"
            styleClass="cies-dialog"
        >
            <div *ngIf="editor" class="cies-dialog-content">
                <p class="dialog-intro">
                    Ajusta los valores que necesites cambiar. Al guardar, el sistema registrará el cambio en la auditoría.
                </p>

                <!-- Sección 1: Puntos de corte -->
                <div class="editor-section">
                    <h3>🎯 Puntos de corte</h3>
                    <p class="section-desc">Define a partir de qué puntaje una persona se clasifica en cada categoría. Un valor más bajo = más fácil de clasificar en esa categoría.</p>

                    <div class="config-summary-grid">
                        <div>
                            <label>Punto de corte «Vulnerable»</label>
                            <p-inputnumber [(ngModel)]="editor.umbralPobre" [min]="0" [max]="100" class="w-full"></p-inputnumber>
                            <small class="field-help">Si el resultado es ≤ este valor, se clasifica como vulnerable</small>
                        </div>
                        <div>
                            <label>Punto de corte «Excluido»</label>
                            <p-inputnumber [(ngModel)]="editor.umbralExcluido" [min]="0" [max]="100" class="w-full"></p-inputnumber>
                            <small class="field-help">Si el resultado es ≤ este valor, se considera excluido</small>
                        </div>
                        <div>
                            <label>Punto de corte «Subatendido»</label>
                            <p-inputnumber [(ngModel)]="editor.umbralSubatendido" [min]="0" [max]="100" class="w-full"></p-inputnumber>
                            <small class="field-help">Si el resultado es ≤ este valor, se marca como subatendido</small>
                        </div>
                    </div>
                </div>

                <!-- Sección 2: Importancia de preguntas -->
                <div class="editor-section">
                    <h3>⚖️ Importancia de cada pregunta</h3>
                    <p class="section-desc">
                        La <strong>importancia</strong> indica cuánto influye cada pregunta en el resultado final.
                        Si pones <strong>0</strong>, esa pregunta no suma ni resta.
                        Si pones <strong>100</strong>, tiene el máximo peso.
                    </p>

                    @for (section of editorPreguntasPorSeccion(); track section.seccion) {
                        <div class="editor-pregunta-group">
                            <h4>{{ sectionIcon(section.seccion) }} {{ section.seccion }}</h4>
                            <p-table [value]="section.preguntas" class="cies-table">
                                <ng-template pTemplate="header">
                                    <tr>
                                        <th style="width: 3rem">#</th>
                                        <th>Pregunta</th>
                                        <th style="width: 10rem">Importancia (0-100)</th>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-q>
                                    <tr [class.muted-row]="q.metadato">
                                        <td>{{ q.numeroVisible }}</td>
                                        <td>
                                            {{ q.etiqueta }}
                                            <span *ngIf="q.metadato" class="badge-metadato">No clasifica</span>
                                        </td>
                                        <td>
                                            <p-inputnumber
                                                [(ngModel)]="q.ponderacion"
                                                [min]="0"
                                                [max]="100"
                                                [disabled]="q.metadato"
                                                class="w-full"
                                            ></p-inputnumber>
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                    }
                </div>

                <!-- Sección 3: Puntos por respuesta -->
                <div class="editor-section">
                    <h3>🔢 Puntos que vale cada respuesta</h3>
                    <p class="section-desc">
                        Cuando una persona responde, la opción elegida aporta estos puntos al resultado total.
                        <strong>Más puntos = más contribución al resultado.</strong>
                    </p>

                    @for (section of editorPreguntasPorSeccion(); track section.seccion) {
                        @for (q of section.preguntas; track q.id) {
                            <div class="editor-opciones-card" *ngIf="q.opciones.length && !q.metadato">
                                <div class="editor-opciones-head">
                                    <span class="editor-opciones-num">{{ q.numeroVisible }}</span>
                                    <strong>{{ q.etiqueta }}</strong>
                                </div>
                                <p-table [value]="q.opciones" class="cies-table">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th>Opción</th>
                                            <th style="width: 10rem">Puntos que aporta</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-op>
                                        <tr>
                                            <td>{{ op.etiqueta }}</td>
                                            <td>
                                                <p-inputnumber
                                                    [(ngModel)]="op.valorNumerico"
                                                    [min]="0"
                                                    [max]="100"
                                                    class="w-full"
                                                ></p-inputnumber>
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </div>
                        }
                    }
                </div>

                <!-- Comentario del cambio -->
                <div class="editor-section editor-section--comentario">
                    <label>📝 ¿Por qué haces este cambio? (para la auditoría)</label>
                    <textarea pTextarea [(ngModel)]="editor.comentarioCambio" rows="2" class="w-full" placeholder="Ejemplo: Se ajustó el umbral de vulnerabilidad según nueva directriz..."></textarea>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" [disabled]="savingEditor" (click)="showEditor = false"></button>
                <button pButton type="button" [label]="savingEditor ? 'Guardando...' : '💾 Guardar cambios'" [disabled]="savingEditor" (click)="save()"></button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        .crud-toolbar {
            display: grid;
            grid-template-columns: minmax(18rem, 1fr) auto;
            gap: 1rem;
            align-items: end;
        }

        .crud-toolbar__selector,
        .create-dialog-content label {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .crud-toolbar__selector label,
        .create-dialog-content label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-color);
        }

        .crud-toolbar__actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        .selected-survey-head {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .selected-survey-meta {
            font-size: 0.82rem;
            color: var(--text-color-secondary);
        }

        .config-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .config-card {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 1rem;
            padding: 1.25rem;
            text-align: center;
        }

        .config-card-label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.5rem;
        }

        .config-card-dot {
            width: 0.6rem;
            height: 0.6rem;
            border-radius: 50%;
            display: inline-block;
        }

        .config-card-dot--pobre { background: #f59e0b; }
        .config-card-dot--excluido { background: #ef4444; }
        .config-card-dot--subatendido { background: #6366f1; }

        .config-card-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .config-card-value small {
            font-size: 0.75rem;
            font-weight: 400;
            color: var(--text-color-secondary);
        }

        .config-explanation {
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            border-radius: 0.75rem;
            padding: 1rem 1.25rem;
            margin-bottom: 1.5rem;
        }

        .config-explanation h4 {
            margin: 0 0 0.5rem;
            font-size: 0.95rem;
        }

        .config-explanation ul {
            margin: 0;
            padding-left: 1.25rem;
            font-size: 0.88rem;
            color: var(--text-color-secondary);
        }

        .config-explanation li {
            margin-bottom: 0.25rem;
        }

        .pregunta-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .pregunta-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.6rem 0.75rem;
            background: var(--surface-ground);
            border-radius: 0.5rem;
            gap: 1rem;
        }

        .pregunta-row.pregunta-metadato {
            opacity: 0.82;
        }

        .pregunta-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex: 1;
            min-width: 0;
        }

        .pregunta-num {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.75rem;
            height: 1.75rem;
            border-radius: 50%;
            background: var(--primary-color);
            color: var(--primary-color-text);
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
        }

        .pregunta-label {
            font-size: 0.88rem;
            color: var(--text-color);
        }

        .pregunta-sub {
            font-size: 0.78rem;
            color: var(--text-color-secondary);
            margin-top: 0.1rem;
        }

        .ponderacion-badge {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 0.4rem;
            background: var(--primary-color);
            color: var(--primary-color-text);
            font-size: 0.78rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .accordion-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
        }

        .accordion-section-icon {
            font-size: 1.1rem;
        }

        .accordion-count {
            margin-left: auto;
            font-size: 0.78rem;
            color: var(--text-color-secondary);
            background: var(--surface-ground);
            padding: 0.15rem 0.5rem;
            border-radius: 0.5rem;
        }

        .dialog-intro {
            background: var(--primary-color);
            color: var(--primary-color-text);
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }

        .editor-section {
            margin-bottom: 2rem;
        }

        .editor-section h3 {
            margin: 0 0 0.25rem;
            font-size: 1.05rem;
        }

        .section-desc {
            color: var(--text-color-secondary);
            font-size: 0.88rem;
            margin: 0 0 1rem;
            line-height: 1.5;
        }

        .field-help {
            display: block;
            color: var(--text-color-secondary);
            font-size: 0.78rem;
            margin-top: 0.25rem;
        }

        .editor-pregunta-group {
            margin-bottom: 1rem;
        }

        .editor-pregunta-group h4 {
            margin: 0.75rem 0 0.5rem;
            font-size: 0.92rem;
            color: var(--text-color-secondary);
        }

        .muted-row {
            opacity: 0.76;
        }

        .badge-metadato {
            display: inline-block;
            margin-left: 0.5rem;
            font-size: 0.72rem;
            padding: 0.1rem 0.4rem;
            border-radius: 0.3rem;
            background: var(--surface-ground);
            color: var(--text-color-secondary);
            border: 1px solid var(--surface-border);
        }

        .editor-opciones-card {
            border: 1px solid var(--surface-border);
            border-radius: 0.75rem;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            background: var(--surface-card);
        }

        .editor-opciones-head {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.88rem;
        }

        .editor-opciones-num {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            background: var(--primary-color);
            color: var(--primary-color-text);
            font-size: 0.7rem;
            font-weight: 700;
        }

        .editor-section--comentario {
            border-top: 1px solid var(--surface-border);
            padding-top: 1rem;
        }

        .editor-section--comentario label {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .cies-actions-row {
            display: flex;
            gap: 0.5rem;
            margin-top: 1.5rem;
            justify-content: flex-end;
        }

        .cies-dialog-content {
            max-height: 70vh;
            overflow-y: auto;
            padding-right: 0.5rem;
        }

        @media (max-width: 768px) {
            .config-summary-grid {
                grid-template-columns: 1fr;
            }

            .crud-toolbar {
                grid-template-columns: 1fr;
            }

            .crud-toolbar__actions {
                justify-content: flex-start;
            }

            .pregunta-row {
                flex-direction: column;
                align-items: flex-start;
            }

            .pregunta-ponderacion {
                margin-left: 2.5rem;
            }
        }

        .comparativo-selector {
            margin-bottom: 1.5rem;
        }

        .comparativo-selector p {
            margin: 0 0 1rem;
            color: var(--text-color-secondary);
        }

        .comparativo-selectors-row {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 1rem;
            align-items: end;
        }

        .comparativo-btn-wrapper {
            display: flex;
            align-items: flex-end;
            height: 2.5rem;
        }

        .comparativo-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
        }

        .comparativo-col {
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            border-radius: 0.75rem;
            padding: 1.25rem;
        }

        .comparativo-col-title {
            margin: 0 0 1rem;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .version-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            background: var(--primary-color);
            color: var(--primary-color-text);
            font-size: 0.7rem;
            font-weight: 700;
        }

        .comparativo-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--surface-border);
        }

        .comparativo-stat:last-child {
            border-bottom: none;
        }

        .stat-label {
            font-size: 0.85rem;
            color: var(--text-color-secondary);
        }

        .stat-value {
            font-size: 0.95rem;
            font-weight: 700;
        }
    `]
})
export class MetodologiaPage implements OnInit {
    private authService = inject(AuthService);
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);

    metodologias: Metodologia[] = [];
    active: Metodologia | null = null;
    showEditor = false;
    editor: Metodologia | null = null;
    showComparativo = false;
    comparativoData: MetodologiaComparativo[] = [];
    comparativoVersion1: number | null = null;
    comparativoVersion2: number | null = null;
    activeMetodologiaId: number | null = null;
    selectedMetodologiaId: number | null = null;
    showCreateDialog = false;
    createForm: CreateMetodologiaForm = this.createEmptyMetodologiaForm();
    creatingSurvey = false;
    savingEditor = false;
    activating = false;
    deleting = false;
    duplicating = false;
    loadingComparativo = false;

    get isBusy(): boolean {
        return this.creatingSurvey || this.savingEditor || this.activating || this.deleting || this.duplicating;
    }

    get canEditConfiguration(): boolean {
        return this.authService.isAdministrador();
    }

    get metodologiaOptions(): Array<{ label: string; value: number }> {
        return this.metodologias.map((item) => ({
            label: item.nombre + (item.id === this.activeMetodologiaId ? ' (Activa)' : ''),
            value: item.id
        }));
    }

    ngOnInit(): void {
        this.load();
    }

    load(preferredId?: number | null, forceRefresh = false): void {
        this.ciesService.listMetodologias(forceRefresh).subscribe({
            next: (response) => {
                const metodologias = [...response].sort((left, right) =>
                    new Date(right.fechaCreacion).getTime() - new Date(left.fechaCreacion).getTime()
                );
                this.metodologias = metodologias;
                this.activeMetodologiaId = metodologias.find((item) => item.activa)?.id || null;

                const targetId = [
                    preferredId,
                    this.selectedMetodologiaId,
                    this.activeMetodologiaId,
                    metodologias[0]?.id
                ].find((id) => id != null && metodologias.some((item) => item.id === id)) || null;

                this.selectMetodologia(targetId);
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading methodologies:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las metodologías' });
            }
        });
    }

    preguntasPorSeccion(): { seccion: string; preguntas: PreguntaEdit[] }[] {
        if (!this.active?.preguntas) return [];
        const map = new Map<string, PreguntaEdit[]>();
        for (const q of this.active.preguntas) {
            const sec = q.seccion || 'General';
            if (!map.has(sec)) map.set(sec, []);
            map.get(sec)!.push(q as PreguntaEdit);
        }
        return Array.from(map.entries()).map(([seccion, preguntas]) => ({ seccion, preguntas }));
    }

    editorPreguntasPorSeccion(): { seccion: string; preguntas: PreguntaEdit[] }[] {
        if (!this.editor?.preguntas) return [];
        const map = new Map<string, PreguntaEdit[]>();
        for (const q of this.editor.preguntas) {
            const sec = q.seccion || 'General';
            if (!map.has(sec)) map.set(sec, []);
            map.get(sec)!.push(q as PreguntaEdit);
        }
        return Array.from(map.entries()).map(([seccion, preguntas]) => ({ seccion, preguntas }));
    }

    sectionIcon(seccion: string): string {
        const icons: Record<string, string> = {
            'Datos de consulta': '📋',
            'Condiciones del hogar': '🏠',
            'Activos y acceso': '📱',
            'Contexto y cierre': '💬'
        };
        return icons[seccion] || '📄';
    }

    openCreateDialog(): void {
        if (!this.canEditConfiguration) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin permisos',
                detail: 'Solo un administrador puede crear encuestas'
            });
            return;
        }

        this.createForm = this.createEmptyMetodologiaForm();
        this.createForm.templateId = this.activeMetodologiaId || this.active?.id || this.metodologias[0]?.id || null;
        this.showCreateDialog = true;
        this.cdr.detectChanges();
    }

    closeCreateDialog(): void {
        if (this.creatingSurvey) return;

        this.showCreateDialog = false;
        this.createForm = this.createEmptyMetodologiaForm();
        this.cdr.detectChanges();
    }

    createSurvey(): void {
        if (this.creatingSurvey) return;

        if (!this.canEditConfiguration) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin permisos',
                detail: 'Solo un administrador puede crear encuestas'
            });
            return;
        }

        const nombre = this.createForm.nombre.trim();
        if (!nombre) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre de la encuesta es obligatorio' });
            return;
        }

        const template = this.metodologias.find((item) => item.id === this.createForm.templateId);
        if (!template) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Debes elegir una plantilla base' });
            return;
        }

        const payload = this.buildMetodologiaPayload(template, {
            nombre,
            descripcion: this.createForm.descripcion.trim() || template.descripcion,
            comentarioCambio: this.createForm.comentarioCambio.trim() || `Nueva encuesta creada desde la plantilla ${template.nombre}`
        });

        this.creatingSurvey = true;
        this.ciesService.createMetodologia(payload).subscribe({
            next: (created) => {
                this.creatingSurvey = false;
                this.closeCreateDialog();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Encuesta creada',
                    detail: `Se creó ${created.nombre} usando ${template.nombre} como plantilla.`
                });
                this.load(created.id, true);
            },
            error: (error) => {
                this.creatingSurvey = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(error, 'No se pudo crear la encuesta')
                });
            }
        });
    }

    activateSelected(): void {
        if (!this.canEditConfiguration || !this.active || this.active.activa || this.activating) return;

        const selectedId = this.active.id;
        const selectedName = this.active.nombre;
        this.activating = true;
        this.ciesService.activateMetodologia(selectedId).subscribe({
            next: () => {
                this.activating = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Encuesta activada',
                    detail: `${selectedName} ahora es la encuesta activa del sistema.`
                });
                this.load(selectedId, true);
            },
            error: (error) => {
                this.activating = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(error, 'No se pudo activar la encuesta')
                });
            }
        });
    }

    deleteSelected(): void {
        if (!this.canEditConfiguration || !this.active || this.active.activa || this.deleting) return;

        if (!window.confirm(`Se eliminará la encuesta "${this.active.nombre}". ¿Deseas continuar?`)) {
            return;
        }

        const deletedId = this.active.id;
        const deletedName = this.active.nombre;
        this.deleting = true;
        this.ciesService.deleteMetodologia(deletedId).subscribe({
            next: () => {
                this.deleting = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Encuesta eliminada',
                    detail: `La encuesta "${deletedName}" se eliminó correctamente.`
                });
                this.load(this.activeMetodologiaId, true);
            },
            error: (error) => {
                this.deleting = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(error, 'No se pudo eliminar la encuesta')
                });
            }
        });
    }

    openComparativo(): void {
        this.showComparativo = true;
        this.comparativoVersion1 = this.active?.id || null;
        this.comparativoVersion2 = null;
        this.comparativoData = [];
        this.cdr.detectChanges();
    }

    async loadComparativo(): Promise<void> {
        if (!this.comparativoVersion1 || !this.comparativoVersion2 || this.loadingComparativo) return;

        this.loadingComparativo = true;
        try {
            const [data1, data2] = await Promise.all([
                firstValueFrom(this.ciesService.getMetodologiaComparativo(this.comparativoVersion1)),
                firstValueFrom(this.ciesService.getMetodologiaComparativo(this.comparativoVersion2))
            ]);
            this.comparativoData = [data1, data2];
            this.cdr.detectChanges();
        } catch (error) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: this.extractErrorMessage(error, 'No se pudo cargar el comparativo')
            });
            console.error('Error loading comparativo:', error);
        } finally {
            this.loadingComparativo = false;
        }
    }

    duplicateVersion(): void {
        if (!this.canEditConfiguration) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin permisos',
                detail: 'Solo un administrador puede duplicar versiones'
            });
            return;
        }

        if (!this.active || this.duplicating) return;

        const sourceId = this.active.id;
        const sourceName = this.active.nombre;
        if (!window.confirm(`Se duplicará la versión "${sourceName}" como una nueva encuesta en borrador. ¿Estás seguro de continuar?`)) {
            return;
        }

        this.duplicating = true;
        this.ciesService.duplicateMetodologia(sourceId).subscribe({
            next: (created) => {
                this.duplicating = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Versión duplicada',
                    detail: `Se creó "${created.nombre}" como copia de "${sourceName}".`
                });
                this.load(created.id, true);
            },
            error: (error) => {
                this.duplicating = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(error, 'No se pudo duplicar la versión')
                });
                console.error('Error duplicating:', error);
            }
        });
    }

    openEdit(item: Metodologia): void {
        if (!this.canEditConfiguration) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin permisos',
                detail: 'Solo un administrador puede editar la configuración'
            });
            return;
        }

        this.editor = JSON.parse(JSON.stringify(item)) as Metodologia;
        this.showEditor = true;
    }

    save(): void {
        if (!this.editor || this.savingEditor) return;

        if (!this.canEditConfiguration) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin permisos',
                detail: 'Solo un administrador puede editar la configuración'
            });
            return;
        }

        if (!this.editor.nombre) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre es obligatorio' });
            return;
        }

        const payload = {
            nombre: this.editor.nombre,
            descripcion: this.editor.descripcion,
            formulaTexto: this.editor.formulaTexto,
            reglaNormalizacion: this.editor.reglaNormalizacion,
            umbralPobre: this.editor.umbralPobre,
            umbralExcluido: this.editor.umbralExcluido,
            umbralSubatendido: this.editor.umbralSubatendido,
            comentarioCambio: this.editor.comentarioCambio || 'Ajuste desde panel de configuración',
            preguntas: this.editor.preguntas
        };

        const editedId = this.editor.id;
        this.savingEditor = true;
        this.ciesService.updateMetodologia(editedId, payload).subscribe({
            next: () => {
                this.savingEditor = false;
                this.showEditor = false;
                this.editor = null;
                this.cdr.detectChanges();
                this.load(editedId, true);
                this.messageService.add({
                    severity: 'success',
                    summary: '✅ Configuración actualizada',
                    detail: 'Los cambios se guardaron y se registraron en la auditoría.'
                });
            },
            error: (error) => {
                this.savingEditor = false;
                console.error('Error saving methodology:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(
                        error,
                        this.canEditConfiguration
                            ? 'No se pudo guardar la configuración'
                            : 'Tu usuario no tiene permisos para editar la configuración'
                    )
                });
            }
        });
    }

    selectMetodologia(id: number | null): void {
        this.selectedMetodologiaId = id;
        this.active = this.metodologias.find((item) => item.id === id) || null;
        this.cdr.detectChanges();
    }

    private createEmptyMetodologiaForm(): CreateMetodologiaForm {
        return {
            nombre: '',
            descripcion: '',
            comentarioCambio: '',
            templateId: null
        };
    }

    private buildMetodologiaPayload(
        template: Metodologia,
        overrides: { nombre: string; descripcion: string; comentarioCambio: string }
    ): Partial<Metodologia> {
        return {
            nombre: overrides.nombre,
            descripcion: overrides.descripcion,
            formulaTexto: template.formulaTexto,
            reglaNormalizacion: template.reglaNormalizacion,
            umbralPobre: template.umbralPobre,
            umbralExcluido: template.umbralExcluido,
            umbralSubatendido: template.umbralSubatendido,
            comentarioCambio: overrides.comentarioCambio,
            preguntas: template.preguntas.map((pregunta) => ({
                orden: pregunta.orden,
                numeroVisible: pregunta.numeroVisible,
                codigoVariable: pregunta.codigoVariable,
                tipo: pregunta.tipo,
                seccion: pregunta.seccion,
                etiqueta: pregunta.etiqueta,
                obligatoria: pregunta.obligatoria,
                metadato: pregunta.metadato,
                ponderacion: pregunta.ponderacion,
                logicaCondicional: pregunta.logicaCondicional,
                validacionTexto: pregunta.validacionTexto,
                opciones: pregunta.opciones.map((opcion) => ({
                    orden: opcion.orden,
                    codigo: opcion.codigo,
                    etiqueta: opcion.etiqueta,
                    valorNumerico: opcion.valorNumerico
                }))
            })) as unknown as Metodologia['preguntas']
        } as Partial<Metodologia>;
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
