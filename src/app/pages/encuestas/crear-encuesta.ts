import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { EncuestaDetalleResponse, EncuestaService, GuardarEncuestaRequest } from '../../service/encuesta.service';

type TipoPregunta = 'TEXTO_CORTO' | 'TEXTO_LARGO' | 'OPCION_UNICA' | 'OPCION_MULTIPLE' | 'SI_NO' | 'COMPLETAR_ORACION' | 'NUMERICA';

type FormatoNumeracion = 'NINGUNA' | 'NUMERO_PARENTESIS' | 'NUMERO_GUION' | 'LETRA_PARENTESIS' | 'LETRA_PUNTO';
type FormatoOpciones = 'SIN_PREFIJO' | 'NUMERO_PARENTESIS' | 'NUMERO_GUION' | 'LETRA_PARENTESIS' | 'LETRA_PUNTO';

interface OpcionPregunta {
    texto: string;
    correcta: boolean;
    orden: number;
}

interface PreguntaEncuesta {
    titulo: string;
    tipo: TipoPregunta;
    obligatoria: boolean;
    orden: number;
    formatoOpciones: FormatoOpciones;
    opciones: OpcionPregunta[];
}

interface BorradorLocalCrearEncuesta {
    tituloEncuesta: string;
    descripcionEncuesta: string;
    modoCalificable: boolean;
    formatoNumeracionGeneral: FormatoNumeracion;
    preguntas: PreguntaEncuesta[];
    timestamp: number;
}

@Component({
    selector: 'app-crear-encuesta',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, TagModule, ToggleSwitchModule, CheckboxModule, RadioButtonModule],
    template: `
        <div class="encuesta-builder">
            <section class="builder-header card">
                <div class="builder-header__info">
                    <div class="builder-badges">
                        <p-tag value="Constructor" severity="info"></p-tag>
                        <p-tag [value]="modoEdicion ? 'Editando encuesta' : modoCalificable ? 'Cuestionario' : 'Encuesta'" severity="contrast"></p-tag>
                    </div>

                    <h1>{{ modoEdicion ? 'Editar encuesta' : 'Crear encuesta' }}</h1>
                    <p>Diseña encuestas dinámicas con distintos tipos de preguntas, numeración configurable y vista previa en tiempo real.</p>
                </div>

                <div class="builder-header__actions">
                    <button pButton type="button" icon="pi pi-arrow-left" label="Volver" severity="secondary" (click)="volverHistorial()"></button>
                    <button *ngIf="!modoEdicion" pButton type="button" icon="pi pi-trash" label="Limpiar todo" severity="danger" [outlined]="true" (click)="limpiarTodo()"></button>
                </div>
            </section>

            <div *ngIf="cargandoDetalle" class="card mb-3">Cargando encuesta...</div>

            <div class="builder-body" *ngIf="!cargandoDetalle">
                <div class="builder-main">
                    <section class="card builder-section">
                        <div class="section-title">
                            <i class="pi pi-file-edit text-primary"></i>
                            <h3>Información general</h3>
                        </div>

                        <div class="form-block">
                            <label>Título de la encuesta</label>
                            <input pInputText [(ngModel)]="tituloEncuesta" (ngModelChange)="onDraftChanged()" class="w-full" placeholder="Ejemplo: Encuesta de satisfacción del cliente" />
                        </div>

                        <div class="form-block">
                            <label>Descripción</label>
                            <textarea pTextarea [(ngModel)]="descripcionEncuesta" (ngModelChange)="onDraftChanged()" rows="4" class="w-full" placeholder="Describe brevemente el objetivo de la encuesta"></textarea>
                        </div>

                        <div class="question-grid">
                            <div class="form-block">
                                <label>Numeración general de preguntas</label>
                                <p-select [options]="formatosNumeracion" [(ngModel)]="formatoNumeracionGeneral" optionLabel="label" optionValue="value" class="w-full" (onChange)="onDraftChanged()"></p-select>
                            </div>
                        </div>

                        <div class="evaluation-box">
                            <div>
                                <h4>Modo calificable</h4>
                                <p>Actívalo si esta encuesta funcionará como cuestionario o examen con respuestas correctas.</p>
                            </div>

                            <p-toggleswitch [(ngModel)]="modoCalificable" (ngModelChange)="onModoCalificableChange()"></p-toggleswitch>
                        </div>
                    </section>

                    <section class="card builder-section">
                        <div class="questions-header">
                            <div>
                                <h3>Preguntas</h3>
                                <p>Agrega, edita y organiza las preguntas de tu encuesta.</p>
                            </div>

                            <p-tag [value]="preguntas.length + ' pregunta(s)'" severity="info"></p-tag>
                        </div>

                        <div *ngIf="errorMessage" class="saved-error mb-3">
                            {{ errorMessage }}
                        </div>

                        <div *ngIf="successMessage" class="saved-message mb-3">
                            {{ successMessage }}
                        </div>

                        <div *ngIf="preguntas.length === 0" class="empty-state">
                            <i class="pi pi-list"></i>
                            <span>Aún no agregaste preguntas.</span>
                        </div>

                        <div *ngFor="let pregunta of preguntas; let i = index" class="question-card">
                            <div class="question-card__top">
                                <div class="question-tags">
                                    <p-tag [value]="'Pregunta ' + (i + 1)" severity="info"></p-tag>
                                    <p-tag [value]="getTipoTexto(pregunta.tipo)" severity="contrast"></p-tag>
                                    <p-tag *ngIf="pregunta.obligatoria" value="Obligatoria" severity="danger"></p-tag>
                                </div>

                                <div class="question-actions">
                                    <button pButton type="button" icon="pi pi-arrow-up" severity="secondary" text rounded [disabled]="i === 0" (click)="moverPregunta(i, -1)"></button>
                                    <button pButton type="button" icon="pi pi-arrow-down" severity="secondary" text rounded [disabled]="i === preguntas.length - 1" (click)="moverPregunta(i, 1)"></button>
                                    <button pButton type="button" icon="pi pi-trash" severity="danger" text rounded (click)="eliminarPregunta(i)"></button>
                                </div>
                            </div>

                            <div class="question-grid">
                                <div class="form-block">
                                    <label>Enunciado</label>
                                    <input pInputText [(ngModel)]="pregunta.titulo" (ngModelChange)="onDraftChanged()" class="w-full" placeholder="Escribe la pregunta" />
                                </div>

                                <div class="form-block">
                                    <label>Tipo de pregunta</label>
                                    <p-select [options]="tiposPregunta" [(ngModel)]="pregunta.tipo" optionLabel="label" optionValue="value" class="w-full" (onChange)="onTipoPreguntaChange(pregunta)"></p-select>
                                </div>
                            </div>

                            <div class="question-grid" *ngIf="muestraFormatoOpciones(pregunta.tipo)">
                                <div class="form-block">
                                    <label>Prefijo de opciones</label>
                                    <p-select [options]="formatosOpciones" [(ngModel)]="pregunta.formatoOpciones" optionLabel="label" optionValue="value" class="w-full" (onChange)="onDraftChanged()"></p-select>
                                </div>
                            </div>

                            <div class="checkbox-row">
                                <p-checkbox [(ngModel)]="pregunta.obligatoria" (ngModelChange)="onDraftChanged()" [binary]="true" [inputId]="'obligatoria-' + i"></p-checkbox>
                                <label [for]="'obligatoria-' + i">Marcar como obligatoria</label>
                            </div>

                            <div *ngIf="requiereOpcionesVisuales(pregunta.tipo)" class="options-box">
                                <div class="options-box__header">
                                    <div>
                                        <h4>Opciones de respuesta</h4>
                                        <p>{{ pregunta.tipo === 'SI_NO' ? 'Pregunta fija de Sí / No.' : 'Configura las opciones que verá el usuario.' }}</p>
                                    </div>

                                    <button *ngIf="permiteEditarOpciones(pregunta.tipo)" pButton type="button" icon="pi pi-plus" label="Agregar opción" size="small" (click)="agregarOpcion(i)"></button>
                                </div>

                                <div *ngIf="modoCalificable" class="correct-help">
                                    <i class="pi pi-info-circle"></i>
                                    <span *ngIf="pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'SI_NO'">Marca una sola opción correcta.</span>
                                    <span *ngIf="pregunta.tipo === 'OPCION_MULTIPLE'">Puedes marcar varias opciones correctas.</span>
                                </div>

                                <div *ngFor="let opcion of pregunta.opciones; let j = index" class="option-row">
                                    <div class="option-order-actions" *ngIf="permiteEditarOpciones(pregunta.tipo)">
                                        <button pButton type="button" icon="pi pi-arrow-up" severity="secondary" text rounded [disabled]="j === 0" (click)="moverOpcion(i, j, -1)"></button>
                                        <button pButton type="button" icon="pi pi-arrow-down" severity="secondary" text rounded [disabled]="j === pregunta.opciones.length - 1" (click)="moverOpcion(i, j, 1)"></button>
                                    </div>

                                    <div class="option-order-actions" *ngIf="!permiteEditarOpciones(pregunta.tipo)">
                                        <span class="option-static-label">{{ getOptionPrefix(j, pregunta.formatoOpciones) || '•' }}</span>
                                    </div>

                                    <div class="option-correct" *ngIf="modoCalificable">
                                        <p-radiobutton
                                            *ngIf="pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'SI_NO'"
                                            name="correcta-unica-{{ i }}"
                                            [value]="j"
                                            [ngModel]="getIndiceCorrecta(pregunta)"
                                            (ngModelChange)="seleccionarOpcionCorrectaUnica(i, j)"
                                        ></p-radiobutton>

                                        <p-checkbox *ngIf="pregunta.tipo === 'OPCION_MULTIPLE'" [(ngModel)]="opcion.correcta" (ngModelChange)="onDraftChanged()" [binary]="true" [inputId]="'correcta-' + i + '-' + j"></p-checkbox>
                                    </div>

                                    <input pInputText [(ngModel)]="opcion.texto" (ngModelChange)="onDraftChanged()" class="w-full" [placeholder]="'Opción ' + (j + 1)" [disabled]="!permiteEditarOpciones(pregunta.tipo)" />

                                    <button *ngIf="permiteEditarOpciones(pregunta.tipo)" pButton type="button" icon="pi pi-times" severity="danger" text rounded (click)="eliminarOpcion(i, j)"></button>
                                </div>
                            </div>

                            <div *ngIf="pregunta.tipo === 'COMPLETAR_ORACION'" class="type-help-box">
                                <i class="pi pi-info-circle"></i>
                                <span>Usa guiones bajos o puntos suspensivos en el enunciado para indicar el espacio a completar. Ejemplo: "La capital de Bolivia es ____".</span>
                            </div>

                            <div *ngIf="pregunta.tipo === 'NUMERICA'" class="type-help-box">
                                <i class="pi pi-hashtag"></i>
                                <span>El usuario responderá con un valor numérico.</span>
                            </div>
                        </div>

                        <div class="questions-actions-sticky">
                            <button pButton type="button" icon="pi pi-plus" label="Agregar pregunta" (click)="agregarPregunta()"></button>

                            <div class="questions-actions-sticky__right">
                                <button *ngIf="!modoEdicion" pButton type="button" icon="pi pi-trash" label="Limpiar todo" severity="danger" [outlined]="true" (click)="limpiarTodo()"></button>

                                <button
                                    pButton
                                    type="button"
                                    severity="success"
                                    icon="pi pi-save"
                                    [label]="guardando ? (modoEdicion ? 'Actualizando...' : 'Guardando...') : modoEdicion ? 'Actualizar encuesta' : 'Guardar borrador'"
                                    [disabled]="guardando || cargandoDetalle"
                                    (click)="guardarBorrador()"
                                ></button>
                            </div>
                        </div>
                    </section>
                </div>

                <aside class="builder-preview">
                    <section class="card preview-card">
                        <div class="section-title">
                            <i class="pi pi-eye text-primary"></i>
                            <h3>Vista previa</h3>
                        </div>

                        <p class="preview-subtitle">Así se vería la encuesta para el usuario final.</p>

                        <div class="preview-box">
                            <div class="preview-head">
                                <h4>{{ tituloEncuesta || 'Sin título' }}</h4>
                                <p>{{ descripcionEncuesta || 'Sin descripción' }}</p>
                            </div>

                            <div class="preview-meta" *ngIf="modoCalificable">
                                <p-tag value="Modo calificable activado" severity="warn"></p-tag>
                            </div>

                            <div *ngIf="preguntas.length === 0" class="preview-empty">No hay preguntas para mostrar.</div>

                            <div *ngFor="let pregunta of preguntas; let i = index" class="preview-question">
                                <div class="preview-question__title">
                                    {{ getPreguntaPrefix(i, formatoNumeracionGeneral) }}{{ pregunta.titulo || 'Pregunta sin texto' }}
                                    <span *ngIf="pregunta.obligatoria" class="required">*</span>
                                </div>

                                <div *ngIf="pregunta.tipo === 'TEXTO_CORTO'">
                                    <input pInputText class="w-full" placeholder="Respuesta corta" disabled />
                                </div>

                                <div *ngIf="pregunta.tipo === 'TEXTO_LARGO'">
                                    <textarea pTextarea rows="3" class="w-full" placeholder="Respuesta larga" disabled></textarea>
                                </div>

                                <div *ngIf="pregunta.tipo === 'COMPLETAR_ORACION'">
                                    <input pInputText class="w-full" placeholder="Completa la oración" disabled />
                                </div>

                                <div *ngIf="pregunta.tipo === 'NUMERICA'">
                                    <input pInputText class="w-full" placeholder="Respuesta numérica" disabled />
                                </div>

                                <div *ngIf="pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'SI_NO'">
                                    <div *ngFor="let opcion of pregunta.opciones; let j = index" class="preview-option">
                                        <label class="flex align-items-center gap-2">
                                            <input type="radio" disabled />
                                            <span>{{ getOptionPrefix(j, pregunta.formatoOpciones) }}{{ opcion.texto || 'Opción vacía' }}</span>
                                            <small *ngIf="modoCalificable && opcion.correcta" class="correct-badge">Correcta</small>
                                        </label>
                                    </div>
                                </div>

                                <div *ngIf="pregunta.tipo === 'OPCION_MULTIPLE'">
                                    <div *ngFor="let opcion of pregunta.opciones; let j = index" class="preview-option">
                                        <label class="flex align-items-center gap-2">
                                            <input type="checkbox" disabled />
                                            <span>{{ getOptionPrefix(j, pregunta.formatoOpciones) }}{{ opcion.texto || 'Opción vacía' }}</span>
                                            <small *ngIf="modoCalificable && opcion.correcta" class="correct-badge">Correcta</small>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    `,
    styles: [
        `
            .encuesta-builder {
                width: 100%;
            }

            .builder-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }

            .builder-badges {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
            }

            .builder-header h1 {
                margin: 0;
                font-size: 2.25rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .builder-header p {
                margin: 0.75rem 0 0 0;
                color: var(--text-color-secondary);
                max-width: 46rem;
                line-height: 1.5;
            }

            .builder-header__actions {
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            .builder-body {
                display: grid;
                grid-template-columns: minmax(0, 1.7fr) minmax(360px, 0.95fr);
                gap: 1.5rem;
                align-items: start;
            }

            .builder-main,
            .builder-preview {
                min-width: 0;
            }

            .builder-preview {
                align-self: start;
                position: sticky;
                top: 1rem;
            }

            .builder-section {
                margin-bottom: 1.5rem;
            }

            .section-title {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                margin-bottom: 1.25rem;
            }

            .section-title h3 {
                margin: 0;
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .form-block {
                margin-bottom: 1.25rem;
            }

            .form-block label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 600;
                color: var(--text-color);
            }

            .evaluation-box {
                border: 1px solid var(--surface-border);
                border-radius: 1rem;
                padding: 1rem 1.25rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                background: var(--surface-50);
            }

            .evaluation-box h4 {
                margin: 0;
                font-size: 1rem;
                font-weight: 700;
            }

            .evaluation-box p {
                margin: 0.4rem 0 0 0;
                color: var(--text-color-secondary);
            }

            .questions-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                margin-bottom: 1.25rem;
            }

            .questions-header h3 {
                margin: 0;
                font-size: 1.8rem;
                font-weight: 700;
            }

            .questions-header p {
                margin: 0.5rem 0 0 0;
                color: var(--text-color-secondary);
            }

            .empty-state {
                background: var(--surface-100);
                border-radius: 0.9rem;
                padding: 2rem;
                text-align: center;
                color: var(--text-color-secondary);
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                align-items: center;
                justify-content: center;
            }

            .empty-state i {
                font-size: 1.6rem;
            }

            .question-card {
                background: var(--surface-card);
                border: 1px solid var(--surface-border);
                border-radius: 1rem;
                padding: 1.25rem;
                margin-bottom: 1rem;
            }

            .question-card__top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .question-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .question-actions {
                display: flex;
                gap: 0.25rem;
                align-items: center;
            }

            .question-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 1rem;
            }

            .question-grid--three {
                grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr) minmax(220px, 1fr);
            }

            .checkbox-row {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.25rem;
                margin-bottom: 0.25rem;
            }

            .options-box {
                margin-top: 1rem;
                background: var(--surface-100);
                border-radius: 0.9rem;
                padding: 1rem;
            }

            .options-box__header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .options-box__header h4 {
                margin: 0;
                font-size: 1rem;
                font-weight: 700;
            }

            .options-box__header p {
                margin: 0.35rem 0 0 0;
                color: var(--text-color-secondary);
            }

            .correct-help {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-color-secondary);
                font-size: 0.95rem;
                margin-bottom: 0.85rem;
            }

            .option-row {
                display: grid;
                grid-template-columns: auto auto 1fr auto;
                gap: 0.75rem;
                align-items: center;
                margin-bottom: 0.65rem;
            }

            .option-order-actions {
                display: flex;
                gap: 0.2rem;
                align-items: center;
                min-width: 4rem;
            }

            .option-correct {
                width: 2rem;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-shrink: 0;
            }

            .option-static-label {
                font-weight: 700;
                color: var(--text-color-secondary);
            }

            .type-help-box {
                margin-top: 1rem;
                display: flex;
                align-items: flex-start;
                gap: 0.65rem;
                padding: 0.85rem 1rem;
                border-radius: 0.85rem;
                background: var(--surface-100);
                color: var(--text-color-secondary);
            }

            .saved-message {
                color: #16a34a;
                font-weight: 600;
            }

            .saved-error {
                color: #dc2626;
                font-weight: 600;
            }

            .questions-actions-sticky {
                position: sticky;
                bottom: 1rem;
                z-index: 5;
                margin-top: 1.5rem;
                padding: 1rem;
                border: 1px solid var(--surface-border);
                border-radius: 1rem;
                background: var(--surface-card);
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .questions-actions-sticky__right {
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            .preview-card {
                max-height: calc(100vh - 2rem);
                overflow: auto;
            }

            .preview-subtitle {
                margin: 0 0 1rem 0;
                color: var(--text-color-secondary);
            }

            .preview-box {
                background: var(--surface-100);
                border-radius: 1rem;
                padding: 1rem;
            }

            .preview-head {
                margin-bottom: 1rem;
            }

            .preview-head h4 {
                margin: 0 0 0.5rem 0;
                font-size: 1.2rem;
                font-weight: 700;
            }

            .preview-head p {
                margin: 0;
                color: var(--text-color-secondary);
            }

            .preview-meta {
                margin-bottom: 1rem;
            }

            .preview-empty {
                color: var(--text-color-secondary);
            }

            .preview-question {
                padding: 0 0 1rem 0;
                margin-bottom: 1rem;
                border-bottom: 1px solid var(--surface-border);
            }

            .preview-question:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }

            .preview-question__title {
                font-weight: 600;
                margin-bottom: 0.75rem;
                line-height: 1.5;
            }

            .preview-option {
                margin-bottom: 0.5rem;
            }

            .required {
                color: #ef4444;
            }

            .correct-badge {
                color: #16a34a;
                font-weight: 700;
            }

            @media (max-width: 1279px) {
                .builder-body {
                    grid-template-columns: 1fr;
                }

                .builder-preview {
                    position: static;
                }

                .preview-card {
                    max-height: none;
                    overflow: visible;
                }
            }

            @media (max-width: 900px) {
                .question-grid,
                .question-grid--three {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 768px) {
                .builder-header,
                .questions-header,
                .options-box__header,
                .question-card__top,
                .evaluation-box,
                .questions-actions-sticky,
                .questions-actions-sticky__right {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .builder-header__actions,
                .questions-actions-sticky__right {
                    width: 100%;
                    justify-content: stretch;
                }

                .option-row {
                    grid-template-columns: 1fr;
                    gap: 0.5rem;
                }

                .option-order-actions {
                    justify-content: flex-start;
                }

                .questions-actions-sticky {
                    position: static;
                }
            }
        `
    ]
})
export class CrearEncuesta implements OnInit {
    private encuestaService = inject(EncuestaService);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    private readonly LOCAL_DRAFT_KEY = 'crear_encuesta_borrador_local_v1';

    encuestaId: number | null = null;
    modoEdicion = false;
    cargandoDetalle = false;

    tituloEncuesta = '';
    descripcionEncuesta = '';
    successMessage = '';
    errorMessage = '';
    modoCalificable = false;
    guardando = false;
    formatoNumeracionGeneral: FormatoNumeracion = 'NUMERO_PARENTESIS';

    tiposPregunta = [
        { label: 'Texto corto', value: 'TEXTO_CORTO' },
        { label: 'Texto largo', value: 'TEXTO_LARGO' },
        { label: 'Opción única', value: 'OPCION_UNICA' },
        { label: 'Opción múltiple', value: 'OPCION_MULTIPLE' },
        { label: 'Sí / No', value: 'SI_NO' },
        { label: 'Completar oración', value: 'COMPLETAR_ORACION' },
        { label: 'Numérica', value: 'NUMERICA' }
    ];

    formatosNumeracion = [
        { label: 'Sin numeración', value: 'NINGUNA' },
        { label: '1)', value: 'NUMERO_PARENTESIS' },
        { label: '1-', value: 'NUMERO_GUION' },
        { label: 'a)', value: 'LETRA_PARENTESIS' },
        { label: 'a.', value: 'LETRA_PUNTO' }
    ];

    formatosOpciones = [
        { label: 'Sin prefijo', value: 'SIN_PREFIJO' },
        { label: '1)', value: 'NUMERO_PARENTESIS' },
        { label: '1-', value: 'NUMERO_GUION' },
        { label: 'a)', value: 'LETRA_PARENTESIS' },
        { label: 'a.', value: 'LETRA_PUNTO' }
    ];

    preguntas: PreguntaEncuesta[] = [];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.encuestaId = Number(id);
            this.modoEdicion = true;
            this.cargarEncuestaParaEditar(this.encuestaId);
            return;
        }

        this.intentarRecuperarBorradorLocal();
    }

    @HostListener('window:beforeunload')
    onBeforeUnload(): void {
        if (!this.modoEdicion) {
            this.guardarBorradorLocal();
        }
    }

    cargarEncuestaParaEditar(id: number): void {
        this.cargandoDetalle = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        this.encuestaService.obtenerDetalleEncuesta(id).subscribe({
            next: (response: EncuestaDetalleResponse) => {
                if (response.estado !== 'DRAFT') {
                    this.errorMessage = 'Solo las encuestas en estado Borrador se pueden editar.';
                    this.cargandoDetalle = false;
                    this.cdr.detectChanges();
                    return;
                }

                this.tituloEncuesta = response.titulo ?? '';
                this.descripcionEncuesta = response.descripcion ?? '';
                this.modoCalificable = !!response.modoCalificable;
                this.preguntas = [...(response.preguntas ?? [])]
                    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                    .map((pregunta, indexPregunta) => ({
                        titulo: pregunta.titulo,
                        tipo: (pregunta.tipo as TipoPregunta) ?? 'TEXTO_CORTO',
                        obligatoria: pregunta.obligatoria,
                        orden: pregunta.orden ?? indexPregunta,
                        formatoNumeracion: (pregunta.formatoNumeracion as FormatoNumeracion) ?? 'NUMERO_PARENTESIS',
                        formatoOpciones: (pregunta.formatoOpciones as FormatoOpciones) ?? 'SIN_PREFIJO',
                        opciones: [...(pregunta.opciones ?? [])]
                            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                            .map((opcion, indexOpcion) => ({
                                texto: opcion.texto,
                                correcta: opcion.correcta,
                                orden: opcion.orden ?? indexOpcion
                            }))
                    }));

                this.preguntas.forEach((pregunta) => {
                    this.asegurarOpcionesSegunTipo(pregunta);
                });

                this.sincronizarOrdenes();
                this.cargandoDetalle = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar encuesta:', error);
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudo cargar la encuesta.';
                this.cargandoDetalle = false;
                this.cdr.detectChanges();
            }
        });
    }

    volverHistorial(): void {
        this.router.navigate(['/pages/encuestas/historial']);
    }

    agregarPregunta(): void {
        this.preguntas.push(this.crearPreguntaVacia());
        this.sincronizarOrdenes();
        this.onDraftChanged();
    }

    eliminarPregunta(index: number): void {
        this.preguntas.splice(index, 1);
        this.sincronizarOrdenes();
        this.onDraftChanged();
    }

    moverPregunta(index: number, direccion: -1 | 1): void {
        const nuevoIndex = index + direccion;

        if (nuevoIndex < 0 || nuevoIndex >= this.preguntas.length) {
            return;
        }

        const temp = this.preguntas[index];
        this.preguntas[index] = this.preguntas[nuevoIndex];
        this.preguntas[nuevoIndex] = temp;

        this.sincronizarOrdenes();
        this.onDraftChanged();
    }

    onTipoPreguntaChange(pregunta: PreguntaEncuesta): void {
        this.asegurarOpcionesSegunTipo(pregunta);

        if (pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'SI_NO') {
            this.normalizarOpcionesUnicas(pregunta);
        }

        this.sincronizarOrdenes();
        this.onDraftChanged();
    }

    onModoCalificableChange(): void {
        if (!this.modoCalificable) {
            this.preguntas.forEach((pregunta) => {
                pregunta.opciones.forEach((opcion) => (opcion.correcta = false));
            });
        }

        this.onDraftChanged();
    }

    agregarOpcion(indexPregunta: number): void {
        const pregunta = this.preguntas[indexPregunta];

        if (!this.permiteEditarOpciones(pregunta.tipo)) {
            return;
        }

        pregunta.opciones.push({
            texto: '',
            correcta: false,
            orden: pregunta.opciones.length
        });

        this.sincronizarOrdenes();
        this.onDraftChanged();
    }

    eliminarOpcion(indexPregunta: number, indexOpcion: number): void {
        const pregunta = this.preguntas[indexPregunta];

        if (!this.permiteEditarOpciones(pregunta.tipo)) {
            return;
        }

        pregunta.opciones.splice(indexOpcion, 1);
        this.sincronizarOrdenes();
        this.onDraftChanged();
    }

    moverOpcion(indexPregunta: number, indexOpcion: number, direccion: -1 | 1): void {
        const pregunta = this.preguntas[indexPregunta];

        if (!this.permiteEditarOpciones(pregunta.tipo)) {
            return;
        }

        const opciones = pregunta.opciones;
        const nuevoIndex = indexOpcion + direccion;

        if (nuevoIndex < 0 || nuevoIndex >= opciones.length) {
            return;
        }

        const temp = opciones[indexOpcion];
        opciones[indexOpcion] = opciones[nuevoIndex];
        opciones[nuevoIndex] = temp;

        this.sincronizarOrdenes();
        this.onDraftChanged();
    }

    seleccionarOpcionCorrectaUnica(indexPregunta: number, indexOpcion: number): void {
        const pregunta = this.preguntas[indexPregunta];

        pregunta.opciones.forEach((opcion, index) => {
            opcion.correcta = index === indexOpcion;
        });

        this.sincronizarOrdenes();
        this.onDraftChanged();
    }

    limpiarTodo(): void {
        const confirmar = window.confirm('¿Deseas limpiar todo y comenzar una encuesta nueva desde cero?');
        if (!confirmar) {
            return;
        }

        this.tituloEncuesta = '';
        this.descripcionEncuesta = '';
        this.modoCalificable = false;
        this.preguntas = [];
        this.successMessage = '';
        this.errorMessage = '';

        this.limpiarBorradorLocal();
        this.cdr.detectChanges();
    }

    getIndiceCorrecta(pregunta: PreguntaEncuesta): number | null {
        const index = pregunta.opciones.findIndex((opcion) => opcion.correcta);
        return index >= 0 ? index : null;
    }

    normalizarOpcionesUnicas(pregunta: PreguntaEncuesta): void {
        let encontrada = false;

        pregunta.opciones.forEach((opcion) => {
            if (opcion.correcta && !encontrada) {
                encontrada = true;
            } else {
                opcion.correcta = false;
            }
        });
    }

    requiereOpcionesVisuales(tipo: TipoPregunta): boolean {
        return tipo === 'OPCION_UNICA' || tipo === 'OPCION_MULTIPLE' || tipo === 'SI_NO';
    }

    permiteEditarOpciones(tipo: TipoPregunta): boolean {
        return tipo === 'OPCION_UNICA' || tipo === 'OPCION_MULTIPLE';
    }

    muestraFormatoOpciones(tipo: TipoPregunta): boolean {
        return this.requiereOpcionesVisuales(tipo);
    }

    getTipoTexto(tipo: TipoPregunta): string {
        switch (tipo) {
            case 'TEXTO_CORTO':
                return 'Texto corto';
            case 'TEXTO_LARGO':
                return 'Texto largo';
            case 'OPCION_UNICA':
                return 'Opción única';
            case 'OPCION_MULTIPLE':
                return 'Opción múltiple';
            case 'SI_NO':
                return 'Sí / No';
            case 'COMPLETAR_ORACION':
                return 'Completar oración';
            case 'NUMERICA':
                return 'Numérica';
            default:
                return tipo;
        }
    }

    getPreguntaPrefix(index: number, formato: FormatoNumeracion): string {
        switch (formato) {
            case 'NUMERO_PARENTESIS':
                return `${index + 1}) `;
            case 'NUMERO_GUION':
                return `${index + 1}- `;
            case 'LETRA_PARENTESIS':
                return `${this.numeroALetra(index)}) `;
            case 'LETRA_PUNTO':
                return `${this.numeroALetra(index)}. `;
            default:
                return '';
        }
    }

    getOptionPrefix(index: number, formato: FormatoOpciones): string {
        switch (formato) {
            case 'NUMERO_PARENTESIS':
                return `${index + 1}) `;
            case 'NUMERO_GUION':
                return `${index + 1}- `;
            case 'LETRA_PARENTESIS':
                return `${this.numeroALetra(index)}) `;
            case 'LETRA_PUNTO':
                return `${this.numeroALetra(index)}. `;
            default:
                return '';
        }
    }

    guardarBorrador(): void {
        if (this.guardando || this.cargandoDetalle) {
            return;
        }

        this.successMessage = '';
        this.errorMessage = '';

        if (!this.tituloEncuesta.trim()) {
            this.errorMessage = 'El título de la encuesta es obligatorio.';
            this.cdr.detectChanges();
            return;
        }

        if (this.preguntas.length === 0) {
            this.errorMessage = 'Debes agregar al menos una pregunta.';
            this.cdr.detectChanges();
            return;
        }

        for (const pregunta of this.preguntas) {
            if (!pregunta.titulo.trim()) {
                this.errorMessage = 'Todas las preguntas deben tener un enunciado.';
                this.cdr.detectChanges();
                return;
            }

            if (this.requiereOpcionesVisuales(pregunta.tipo)) {
                if (pregunta.opciones.length < 2) {
                    this.errorMessage = `La pregunta "${pregunta.titulo}" debe tener al menos dos opciones.`;
                    this.cdr.detectChanges();
                    return;
                }

                for (const opcion of pregunta.opciones) {
                    if (!opcion.texto.trim()) {
                        this.errorMessage = `Todas las opciones de la pregunta "${pregunta.titulo}" deben tener texto.`;
                        this.cdr.detectChanges();
                        return;
                    }
                }

                if (pregunta.tipo === 'SI_NO' && pregunta.opciones.length !== 2) {
                    this.errorMessage = `La pregunta "${pregunta.titulo}" debe tener exactamente Sí y No.`;
                    this.cdr.detectChanges();
                    return;
                }

                if (this.modoCalificable) {
                    const cantidadCorrectas = pregunta.opciones.filter((opcion) => opcion.correcta).length;

                    if ((pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'SI_NO') && cantidadCorrectas !== 1) {
                        this.errorMessage = `La pregunta "${pregunta.titulo}" debe tener exactamente una opción correcta.`;
                        this.cdr.detectChanges();
                        return;
                    }

                    if (pregunta.tipo === 'OPCION_MULTIPLE' && cantidadCorrectas === 0) {
                        this.errorMessage = `La pregunta "${pregunta.titulo}" debe tener al menos una opción correcta.`;
                        this.cdr.detectChanges();
                        return;
                    }
                }
            }
        }

        this.sincronizarOrdenes();

        this.guardando = true;
        this.cdr.detectChanges();

        const payload: GuardarEncuestaRequest = {
            titulo: this.tituloEncuesta.trim(),
            descripcion: this.descripcionEncuesta.trim(),
            modoCalificable: this.modoCalificable,
            preguntas: this.preguntas.map((pregunta) => ({
                titulo: pregunta.titulo.trim(),
                tipo: pregunta.tipo,
                obligatoria: pregunta.obligatoria,
                orden: pregunta.orden,
                formatoNumeracion: this.formatoNumeracionGeneral,
                formatoOpciones: pregunta.formatoOpciones,
                opciones: pregunta.opciones.map((opcion) => ({
                    texto: opcion.texto.trim(),
                    correcta: this.modoCalificable ? opcion.correcta : false,
                    orden: opcion.orden
                }))
            }))
        };

        const request$ = this.modoEdicion && this.encuestaId ? this.encuestaService.actualizarEncuesta(this.encuestaId, payload) : this.encuestaService.guardarEncuesta(payload);

        request$.subscribe({
            next: (response) => {
                this.successMessage = this.modoEdicion ? `Encuesta actualizada correctamente con ID ${response.id}.` : `Encuesta guardada correctamente con ID ${response.id}.`;
                this.errorMessage = '';
                this.guardando = false;

                if (!this.modoEdicion) {
                    this.limpiarBorradorLocal();
                }

                this.cdr.detectChanges();
            },
            error: (error) => {
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudo guardar la encuesta.';
                this.successMessage = '';
                this.guardando = false;
                this.cdr.detectChanges();
            }
        });
    }

    onDraftChanged(): void {
        this.successMessage = '';
        if (!this.modoEdicion) {
            this.guardarBorradorLocal();
        }
        this.cdr.detectChanges();
    }

    private intentarRecuperarBorradorLocal(): void {
        const raw = localStorage.getItem(this.LOCAL_DRAFT_KEY);
        if (!raw) {
            return;
        }

        try {
            const borrador = JSON.parse(raw) as BorradorLocalCrearEncuesta;
            const continuar = window.confirm('Se encontró una encuesta sin terminar. ¿Quieres continuar donde la dejaste?');

            if (continuar) {
                this.restaurarBorradorLocal(borrador);
            } else {
                this.limpiarBorradorLocal();
            }
        } catch {
            this.limpiarBorradorLocal();
        }
    }

    private restaurarBorradorLocal(borrador: BorradorLocalCrearEncuesta): void {
        this.tituloEncuesta = borrador.tituloEncuesta ?? '';
        this.descripcionEncuesta = borrador.descripcionEncuesta ?? '';
        this.modoCalificable = !!borrador.modoCalificable;
        this.formatoNumeracionGeneral = (borrador.formatoNumeracionGeneral as FormatoNumeracion) ?? 'NUMERO_PARENTESIS';
        this.preguntas = Array.isArray(borrador.preguntas)
            ? borrador.preguntas.map((pregunta, indexPregunta) => ({
                  titulo: pregunta.titulo ?? '',
                  tipo: (pregunta.tipo as TipoPregunta) ?? 'TEXTO_CORTO',
                  obligatoria: !!pregunta.obligatoria,
                  orden: pregunta.orden ?? indexPregunta,
                  formatoOpciones: (pregunta.formatoOpciones as FormatoOpciones) ?? 'SIN_PREFIJO',
                  opciones: Array.isArray(pregunta.opciones)
                      ? pregunta.opciones.map((opcion, indexOpcion) => ({
                            texto: opcion.texto ?? '',
                            correcta: !!opcion.correcta,
                            orden: opcion.orden ?? indexOpcion
                        }))
                      : []
              }))
            : [];

        this.preguntas.forEach((pregunta) => this.asegurarOpcionesSegunTipo(pregunta));
        this.sincronizarOrdenes();
    }

    private guardarBorradorLocal(): void {
        const tieneContenido = !!this.tituloEncuesta.trim() || !!this.descripcionEncuesta.trim() || this.preguntas.length > 0 || this.modoCalificable;

        if (!tieneContenido) {
            this.limpiarBorradorLocal();
            return;
        }

        const borrador: BorradorLocalCrearEncuesta = {
            tituloEncuesta: this.tituloEncuesta,
            descripcionEncuesta: this.descripcionEncuesta,
            modoCalificable: this.modoCalificable,
            formatoNumeracionGeneral: this.formatoNumeracionGeneral,
            preguntas: this.preguntas.map((pregunta) => ({
                titulo: pregunta.titulo,
                tipo: pregunta.tipo,
                obligatoria: pregunta.obligatoria,
                orden: pregunta.orden,
                formatoOpciones: pregunta.formatoOpciones,
                opciones: pregunta.opciones.map((opcion) => ({
                    texto: opcion.texto,
                    correcta: opcion.correcta,
                    orden: opcion.orden
                }))
            })),
            timestamp: Date.now()
        };

        localStorage.setItem(this.LOCAL_DRAFT_KEY, JSON.stringify(borrador));
    }

    private limpiarBorradorLocal(): void {
        localStorage.removeItem(this.LOCAL_DRAFT_KEY);
    }

    private crearPreguntaVacia(): PreguntaEncuesta {
        return {
            titulo: '',
            tipo: 'TEXTO_CORTO',
            obligatoria: false,
            orden: this.preguntas.length,
            formatoOpciones: 'SIN_PREFIJO',
            opciones: []
        };
    }

    private asegurarOpcionesSegunTipo(pregunta: PreguntaEncuesta): void {
        if (pregunta.tipo === 'SI_NO') {
            pregunta.opciones = this.crearOpcionesSiNo(pregunta.opciones);
            return;
        }

        if (pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'OPCION_MULTIPLE') {
            if (!pregunta.opciones || pregunta.opciones.length === 0) {
                pregunta.opciones = [
                    { texto: '', correcta: false, orden: 0 },
                    { texto: '', correcta: false, orden: 1 }
                ];
            }
            return;
        }

        pregunta.opciones = [];
    }

    private crearOpcionesSiNo(opcionesActuales: OpcionPregunta[]): OpcionPregunta[] {
        const siActual = opcionesActuales?.[0];
        const noActual = opcionesActuales?.[1];

        return [
            {
                texto: siActual?.texto?.trim() ? siActual.texto : 'Sí',
                correcta: !!siActual?.correcta,
                orden: 0
            },
            {
                texto: noActual?.texto?.trim() ? noActual.texto : 'No',
                correcta: !!noActual?.correcta,
                orden: 1
            }
        ];
    }

    private numeroALetra(index: number): string {
        let numero = index;
        let resultado = '';

        do {
            resultado = String.fromCharCode(97 + (numero % 26)) + resultado;
            numero = Math.floor(numero / 26) - 1;
        } while (numero >= 0);

        return resultado;
    }

    private sincronizarOrdenes(): void {
        this.preguntas.forEach((pregunta, indexPregunta) => {
            pregunta.orden = indexPregunta;
            pregunta.opciones.forEach((opcion, indexOpcion) => {
                opcion.orden = indexOpcion;
            });
        });
    }
}