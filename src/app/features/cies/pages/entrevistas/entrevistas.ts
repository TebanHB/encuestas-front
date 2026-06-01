import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';
import { FechaCortaPipe } from '../../../../shared/pipes/formato.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, Entrevista, EntrevistaFinalizadaResumen, FinalizarEntrevistaPayload, PersonaBusquedaCiResponse, PersonaElegible, PreguntaInstrumento, RespuestaPayload } from '../../services/cies.service';

interface AnswerValue {
    codigoOpcion?: string;
    valorTexto?: string;
    valorOtro?: string;
}

interface ValidationError {
    preguntaId: number;
    codigoVariable: string;
    etiqueta: string;
    mensaje: string;
}

interface InterviewDraftSnapshot {
    interviewId: number;
    userId: number | string;
    currentStep: number;
    consentimientoAceptado: boolean;
    answers: Record<number, AnswerValue>;
    updatedAt: string;
}

interface DirectRegistrationLookupNotice {
    severity: 'info' | 'error';
    message: string;
}

type DirectRegistrationStep = 'search' | 'form' | 'not-found';

interface DirectRegistrationLockedFields {
    nombre: boolean;
    apellido: boolean;
    documento: boolean;
    medicarePersonId: boolean;
}

interface DirectRegistrationLockedSnapshot {
    nombre: string;
    apellido: string;
    documento: string;
    medicarePersonId: string;
}

@Component({
    selector: 'app-entrevistas-page',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, DialogModule, InputTextModule,
        SelectModule, TableModule, TagModule, TextareaModule, Toast, ProgressBarModule, TooltipModule,
        CiesInfoHintComponent, FechaCortaPipe
    ],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <!-- HEADER: Trabajo de campo -->
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--naranja">
                        <i class="pi pi-file-edit"></i> Trabajo de campo
                    </div>
                    <h1 class="cies-hero__title">Aplicar entrevistas</h1>
                    <p class="cies-hero__copy">
                        Aplica el Instrumento de Vulnerabilidad CIES de forma digital.
                        El sistema validará en tiempo real y guiará a enfermería paso a paso.
                    </p>
                </div>
                <div class="cies-hero__actions">
                    <button pButton type="button" label="Registrar persona nueva" icon="pi pi-user-plus"
                        class="direct-registration-button direct-registration-button--hero"
                        [disabled]="isInterviewActionBusy" pTooltip="Registra una persona que aún no está en el listado"
                        (click)="openDirectRegistration()"></button>
                    <button pButton type="button" [label]="loadingPendientes ? 'Actualizando...' : 'Actualizar listado'" icon="pi pi-refresh"
                        severity="secondary" [text]="true" [disabled]="isInterviewActionBusy"
                        pTooltip="Vuelve a consultar las personas pendientes"
                        (click)="loadPendientes(true)"></button>
                </div>
            </section>

            <section *ngIf="!currentInterview" class="card cies-list-tabs" [attr.data-active-tab]="activeListTab">
                <span class="cies-list-tabs__indicator" aria-hidden="true"></span>
                <button pButton type="button" class="cies-list-tab"
                    [class.cies-list-tab--active]="activeListTab === 'pendientes'"
                    [text]="true"
                    label="Pendientes" icon="pi pi-clock"
                    (click)="setActiveListTab('pendientes')"></button>
                <button pButton type="button" class="cies-list-tab"
                    [class.cies-list-tab--active]="activeListTab === 'finalizadas'"
                    [text]="true"
                    label="Finalizado" icon="pi pi-check-circle"
                    (click)="setActiveListTab('finalizadas')"></button>
            </section>

            <!-- ===================== VISTA: Lista de pendientes ===================== -->
            <section *ngIf="!currentInterview && activeListTab === 'pendientes'" class="cies-guidance-grid">
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">1</div>
                    <div class="cies-stack">
                        <h4>Persona nueva</h4>
                        <p>Usa el botón <strong>"Registrar persona nueva"</strong> arriba para registrarla y abrir la entrevista automáticamente.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">2</div>
                    <div class="cies-stack">
                        <h4>Persona ya en lista</h4>
                        <p>Solo pulsa <strong>"Iniciar"</strong> en la fila correspondiente.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">3</div>
                    <div class="cies-stack">
                        <h4>Al finalizar</h4>
                        <p>Completa todas las obligatorias y pulsa <strong>"Finalizar entrevista"</strong>.</p>
                    </div>
                </article>
            </section>

            <!-- TABLA de pendientes -->
            <section *ngIf="!currentInterview && activeListTab === 'pendientes'" class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Personas listas para entrevistar</h3>
                            <p>Selecciona una persona para iniciar la entrevista. Se mostrarán las preguntas guiadas.</p>
                        </div>
                        <app-cies-info-hint text="Solo se muestran casos pendientes o entrevistas en curso vinculadas al encuestador actual."></app-cies-info-hint>
                    </div>
                    <p-tag *ngIf="pendientes.length"
                        [value]="filteredPendientesList.length + ' de ' + pendientes.length + ' visibles'"
                        severity="info"></p-tag>
                </div>

                <!-- Empty state -->
                <div *ngIf="!pendientes.length" class="cies-empty-state">
                    <div class="cies-empty-state__icon"><i class="pi pi-face-smile"></i></div>
                    <h3>No hay personas pendientes en este momento</h3>
                    <p>Si acaba de llegar una persona, puedes registrarla directamente.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Registrar persona nueva" icon="pi pi-user-plus"
                            class="direct-registration-button"
                            [disabled]="isInterviewActionBusy"
                            (click)="openDirectRegistration()"></button>
                    </div>
                </div>

                <!-- Filtros -->
                <div *ngIf="pendientes.length" class="cies-form-grid cies-form-grid--three">
                    <div class="cies-field--wide">
                        <label>Buscar persona</label>
                        <input pInputText [ngModel]="searchTerm" class="w-full" pTooltip="Busca por nombre, documento, código o clínica"
                            placeholder="Nombre, documento, código o clínica..." (ngModelChange)="onSearchTermChange($event)" />
                    </div>
                    <div>
                        <label>Estado</label>
                        <p-select [options]="estadoOptions" [ngModel]="selectedEstado"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todos los estados" (ngModelChange)="onEstadoChange($event)"></p-select>
                    </div>
                    <div *ngIf="isAdmin">
                        <label>Clínica</label>
                        <p-select [options]="clinicaOptions" [ngModel]="selectedClinica"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todas las clínicas" (ngModelChange)="onClinicaChange($event)"></p-select>
                    </div>
                    <div *ngIf="isAdmin">
                        <label>Listado</label>
                        <p-select [options]="loteOptions" [ngModel]="selectedLote"
                            optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                            placeholder="Todos los listados" (ngModelChange)="onLoteChange($event)"></p-select>
                    </div>
                </div>

                <!-- Sin resultados -->
                <div *ngIf="pendientes.length && !filteredPendientesList.length" class="cies-empty-state">
                    <div class="cies-empty-state__icon"><i class="pi pi-search"></i></div>
                    <h3>No hay coincidencias</h3>
                    <p>Prueba quitando filtros para ver todas las personas.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Quitar filtros" severity="secondary"
                            [outlined]="true" icon="pi pi-times" (click)="clearFilters()"></button>
                    </div>
                </div>

                <!-- Tabla -->
                <p-table *ngIf="filteredPendientesList.length" [value]="filteredPendientesList"
                    [tableStyle]="{ 'min-width': '76rem' }" responsiveLayout="scroll"
                    [paginator]="true" [rows]="5" [rowsPerPageOptions]="[5, 10, 20]"
                    class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="nombreCompleto">Persona <p-sortIcon field="nombreCompleto"></p-sortIcon></th>
                            <th>Listado</th>
                            <th>Documento</th>
                            <th pSortableColumn="clinica">Clínica <p-sortIcon field="clinica"></p-sortIcon></th>
                            <th pSortableColumn="regional">Regional <p-sortIcon field="regional"></p-sortIcon></th>
                            <th pSortableColumn="fechaConsulta">Fecha <p-sortIcon field="fechaConsulta"></p-sortIcon></th>
                            <th style="width: 8rem">Acción</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>
                                <strong>{{ item.nombreCompleto }}</strong>
                            </td>
                            <td>
                                <div class="cies-stack" style="gap: 0.35rem">
                                    <strong>{{ item.loteNombre || 'Sin listado' }}</strong>
                                    <p-tag [value]="isDirectRegistration(item) ? 'Registro directo' : 'Carga por listado'"
                                        [severity]="isDirectRegistration(item) ? 'success' : 'info'"
                                        [style]="{ 'font-size': '0.7rem' }"></p-tag>
                                </div>
                            </td>
                            <td>{{ item.documento || '—' }}</td>
                            <td>{{ item.clinica }}</td>
                            <td>{{ item.regional }}</td>
                            <td>{{ item.fechaConsulta | fechaCorta }}</td>
                            <td>
                                <button pButton type="button" [label]="startingPersonaId === item.id ? 'Abriendo...' : 'Iniciar'" icon="pi pi-play"
                                    size="small" [loading]="startingPersonaId === item.id"
                                    [disabled]="isInterviewActionBusy && startingPersonaId !== item.id" (click)="start(item)"></button>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section *ngIf="!currentInterview && activeListTab === 'finalizadas'" class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Personas ya encuestadas</h3>
                            <p>Consulta entrevistas finalizadas y abre el detalle completo de respuestas.</p>
                        </div>
                        <p-tag *ngIf="finalizadas.length" [value]="filteredFinalizadas.length + ' de ' + finalizadas.length + ' visibles'" severity="success"></p-tag>
                    </div>
                </div>

                <div class="cies-form-grid cies-form-grid--three" *ngIf="finalizadas.length">
                    <div class="cies-field--wide">
                        <label>Buscar entrevista finalizada</label>
                        <input pInputText [ngModel]="finalizadasSearchTerm" class="w-full"
                            placeholder="Nombre, documento, código, clínica o encuestador..."
                            (ngModelChange)="onFinalizadasSearchChange($event)" />
                    </div>
                </div>

                <div *ngIf="!finalizadas.length && !loadingFinalizadas" class="cies-empty-state">
                    <div class="cies-empty-state__icon"><i class="pi pi-check"></i></div>
                    <h3>Aún no hay entrevistas finalizadas</h3>
                    <p>Cuando se complete una encuesta, aparecerá aquí para consulta y revisión.</p>
                </div>

                <div *ngIf="finalizadas.length && !filteredFinalizadas.length" class="cies-empty-state">
                    <div class="cies-empty-state__icon"><i class="pi pi-search"></i></div>
                    <h3>No hay coincidencias</h3>
                    <p>Prueba con otro término para encontrar la entrevista finalizada.</p>
                </div>

                <p-table *ngIf="filteredFinalizadas.length" [value]="filteredFinalizadas"
                    [tableStyle]="{ 'min-width': '78rem' }" responsiveLayout="scroll"
                    [paginator]="true" [rows]="5" [rowsPerPageOptions]="[5, 10, 20]"
                    class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Persona</th>
                            <th>Documento</th>
                            <th>Clínica</th>
                            <th>Regional</th>
                            <th>Finalizó</th>
                            <th>Condiciones</th>
                            <th style="width: 8rem">Detalle</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>
                                <div class="cies-stack" style="gap: 0.35rem">
                                    <strong>{{ item.personaNombre }}</strong>
                                    <small class="text-muted">{{ item.codigoEntrevista }}</small>
                                </div>
                            </td>
                            <td>{{ item.documento || '—' }}</td>
                            <td>{{ item.clinica }}</td>
                            <td>{{ item.regional }}</td>
                            <td>{{ item.fechaFin | fechaCorta }}</td>
                            <td>
                                <div class="cies-flag-list" *ngIf="canViewSensitiveResults; else restrictedFinalizadaResult">
                                    <p-tag *ngIf="item.pobre" value="Pobreza" severity="danger"></p-tag>
                                    <p-tag *ngIf="item.excluido" value="Excluida" severity="warn"></p-tag>
                                    <p-tag *ngIf="item.subatendido" value="Subatendida" severity="info"></p-tag>
                                    <span *ngIf="!item.pobre && !item.excluido && !item.subatendido" class="text-muted">Sin condiciones</span>
                                </div>
                                <ng-template #restrictedFinalizadaResult>
                                    <span class="text-muted">Resultado reservado</span>
                                </ng-template>
                            </td>
                            <td>
                                <button pButton type="button" label="Ver" icon="pi pi-eye" size="small"
                                    [loading]="loadingFinalizadaDetalleId === item.entrevistaId"
                                    (click)="openFinalizadaDetalle(item)"></button>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <!-- ===================== VISTA: Entrevista en curso ===================== -->
            <section *ngIf="currentInterview" class="card entrevista-card">
                <!-- Cabecera de la entrevista -->
                <div class="entrevista-header">
                    <div class="entrevista-info">
                        <div class="entrevista-codigo">
                            <i class="pi pi-ticket"></i>
                            <span>{{ currentInterview.codigo }}</span>
                        </div>
                        <div class="entrevista-persona">
                            <h3>{{ currentInterview.personaNombre }}</h3>
                            <div class="entrevista-meta">
                                <span><i class="pi pi-map-marker"></i> {{ currentInterview.clinica }} - {{ currentInterview.regional }}</span>
                                <span><i class="pi pi-user"></i> {{ currentInterview.encuestador }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="entrevista-actions">
                        <div class="progress-container">
                            <p-progressBar [value]="progressPercent" [style]="{ height: '8px' }"
                                [class]="progressPercent === 100 ? 'progress-complete' : ''"></p-progressBar>
                            <span class="progress-label">
                                <ng-container *ngIf="currentQuestion; else noQuestionProgress">
                                    Pregunta {{ stepProgress }} de {{ totalSteps }} · {{ progressPercent }}%
                                </ng-container>
                                <ng-template #noQuestionProgress>Sin preguntas disponibles</ng-template>
                            </span>
                            <span class="draft-status" [class.draft-status--error]="draftStatus === 'error'">{{ draftStatusLabel }}</span>
                        </div>
                        <button pButton type="button" label="Cerrar" icon="pi pi-times" severity="secondary" [text]="true"
                            (click)="confirmClose()"></button>
                    </div>
                </div>

                <!-- Nota guía -->
                <div class="entrevista-guide-note">
                    <i class="pi pi-info-circle"></i>
                    <span>Responde de arriba hacia abajo. Los campos marcados con
                        <strong class="required-marker" aria-label="obligatoria">*</strong>
                        (en rojo) son <strong>obligatorios</strong>.</span>
                </div>

                <!-- Alerta de terminación anticipada -->
                <div class="cies-note cies-note--warning" *ngIf="terminatesInterview">
                    <i class="pi pi-exclamation-triangle"></i>
                    <div>
                        <strong>Entrevista termina aquí</strong>
                        <p>{{ terminationMessage }}</p>
                    </div>
                </div>

                <!-- Errores de validación -->
                <div class="cies-note cies-note--error" *ngIf="showValidation && validationErrors.length">
                    <i class="pi pi-times-circle"></i>
                    <div>
                        <strong>Faltan {{ validationErrors.length }} respuesta{{ validationErrors.length > 1 ? 's' : '' }} obligatoria{{ validationErrors.length > 1 ? 's' : '' }}</strong>
                        <p>Las preguntas marcadas en rojo necesitan una respuesta antes de finalizar.</p>
                    </div>
                </div>

                <!-- Éxito validación -->
                <div class="cies-note cies-note--success" *ngIf="showValidation && validationErrors.length === 0 && visibleQuestions.length > 0">
                    <i class="pi pi-check-circle"></i>
                    <span>Todas las respuestas obligatorias están completas. Puedes finalizar la entrevista.</span>
                </div>

                <div class="consent-card" *ngIf="!hasConsentimientoAprobado">
                    <div class="consent-card__icon">
                        <i class="pi pi-shield"></i>
                    </div>
                    <div class="consent-card__content">
                        <h4>Consentimiento informado</h4>
                        <p>
                            Antes de continuar, confirma que la persona fue informada sobre la encuesta y acepto responderla.
                            Sin este registro no se puede finalizar la entrevista.
                        </p>
                        <div class="consent-card__actions">
                            <button pButton type="button" label="Acepta y continuar" icon="pi pi-check"
                                [disabled]="submitting" (click)="acceptConsent()"></button>
                            <button pButton type="button" label="No acepta" severity="secondary" [outlined]="true"
                                icon="pi pi-times" [disabled]="submitting" (click)="rejectConsent()"></button>
                        </div>
                    </div>
                </div>

                <!-- PREGUNTAS -->
                <div class="preguntas-container" *ngIf="hasConsentimientoAprobado && currentQuestion as question; else noQuestionsState">
                    <div class="question-step">
                        <div class="question-step__eyebrow">Pregunta {{ stepProgress }} de {{ totalSteps }}</div>
                        <div class="question-step__title">{{ question.numeroVisible }}. {{ question.etiqueta }}</div>
                    </div>
                    <div
                        class="question-card"
                        [class.question-answered]="isQuestionAnswered(question)"
                        [class.question-invalid]="showValidation && isQuestionInvalid(question)"
                        [class.question-terminates]="terminatesInterview && isTerminationQuestion(question)"
                        [class.question-skipped]="shouldSkipQuestion(question)"
                        [id]="'question-' + question.id">

                        <!-- Número y etiqueta -->
                        <div class="question-header">
                            <div class="question-number">
                                {{ question.numeroVisible }}
                            </div>
                            <div class="question-content">
                                <label class="question-label">
                                    {{ question.etiqueta }}
                                </label>
                                <span class="question-type-badge">{{ getQuestionTypeLabel(question.tipo) }}</span>
                                <span class="question-skipped-badge" *ngIf="shouldSkipQuestion(question)">
                                    <i class="pi pi-forward"></i> Omitida automáticamente
                                </span>
                            </div>
                        </div>

                        <!-- Respuesta: Opción única / Booleano -->
                        <div *ngIf="isOptionQuestion(question)" class="question-answer">
                            <div class="opciones-grid" [class.opciones-disabled]="shouldSkipQuestion(question)">
                                <button *ngFor="let opcion of question.opciones"
                                    type="button"
                                    class="opcion-card"
                                    [class.opcion-selected]="answers[question.id]?.codigoOpcion === opcion.codigo"
                                    [class.opcion-invalid]="showValidation && isQuestionInvalid(question) && answers[question.id]?.codigoOpcion === opcion.codigo"
                                    [class.opcion-disabled]="shouldSkipQuestion(question)"
                                    [disabled]="shouldSkipQuestion(question)"
                                    (click)="selectOpcion(question.id, opcion.codigo)">
                                    <div class="opcion-radio">
                                        <div class="opcion-radio-circle"
                                            [class.checked]="answers[question.id]?.codigoOpcion === opcion.codigo">
                                        </div>
                                    </div>
                                    <div class="opcion-label">{{ opcion.etiqueta }}</div>
                                    <i class="pi pi-check opcion-check"
                                        *ngIf="answers[question.id]?.codigoOpcion === opcion.codigo"></i>
                                </button>
                            </div>

                            <!-- Input cuando se selecciona "Otro" -->
                            <div *ngIf="isCurrentSelectedOtro(question) && !shouldSkipQuestion(question) && !isTerminationQuestion(question)" class="otro-input-wrapper">
                                <label class="otro-label">{{ getOtroLabel(question) }}</label>
                                <input pInputText [ngModel]="answers[question.id].valorOtro || ''"
                                    class="w-full input-texto"
                                    [maxlength]="OTRO_MAX_LENGTH"
                                    [class.input-invalid]="showValidation && isQuestionInvalid(question)"
                                    (ngModelChange)="onOtroChange(question.id, $event)"
                                    [placeholder]="getOtroPlaceholder(question)" />
                                <small class="otro-helper">
                                    {{ getOtroLength(question.id) }}/{{ OTRO_MAX_LENGTH }} caracteres
                                </small>
                            </div>
                        </div>

                        <!-- Respuesta: Texto -->
                        <div *ngIf="question.tipo === 'TEXTO'" class="question-answer">
                            <input pInputText [(ngModel)]="answers[question.id].valorTexto"
                                class="w-full input-texto"
                                [class.input-invalid]="showValidation && isQuestionInvalid(question)"
                                [disabled]="shouldSkipQuestion(question)"
                                (ngModelChange)="onAnswerChange()"
                                placeholder="Escribe la respuesta..." />
                        </div>

                        <!-- Respuesta: Fecha/Hora -->
                        <div *ngIf="question.tipo === 'FECHA_HORA'" class="question-answer">
                            <input pInputText [(ngModel)]="answers[question.id].valorTexto"
                                class="w-full input-texto"
                                type="datetime-local"
                                [class.input-invalid]="showValidation && isQuestionInvalid(question)"
                                [disabled]="shouldSkipQuestion(question)"
                                (ngModelChange)="onAnswerChange()" />
                        </div>

                        <!-- Respuesta: Texto largo -->
                        <div *ngIf="question.tipo === 'TEXTO_LARGO'" class="question-answer">
                            <textarea pTextarea [(ngModel)]="answers[question.id].valorTexto"
                                rows="3" class="w-full input-texto-largo"
                                [class.input-invalid]="showValidation && isQuestionInvalid(question)"
                                [disabled]="shouldSkipQuestion(question)"
                                (ngModelChange)="onAnswerChange()"
                                placeholder="Escribe la respuesta..."></textarea>
                        </div>

                        <!-- Lógica condicional -->
                        <small class="question-logic-hint" *ngIf="question.logicaCondicional && !shouldSkipQuestion(question)">
                            <i class="pi pi-info-circle"></i> {{ question.logicaCondicional }}
                        </small>
                        <small class="question-logic-hint" *ngIf="shouldSkipQuestion(question)">
                            <i class="pi pi-info-circle"></i> {{ getSkipLogic(question) || 'Omitida según la respuesta previa.' }}
                        </small>

                        <!-- Error inline -->
                        <small class="question-error" *ngIf="showValidation && isQuestionInvalid(question)">
                            <i class="pi pi-exclamation-circle"></i> Esta respuesta es obligatoria.
                        </small>
                    </div>
                </div>
                <ng-template #noQuestionsState>
                    <div class="cies-note cies-note--warning" *ngIf="hasConsentimientoAprobado">
                        <i class="pi pi-info-circle"></i>
                        <span>No hay preguntas disponibles para esta entrevista.</span>
                    </div>
                </ng-template>

                <!-- Acciones finales -->
                <div class="entrevista-footer" *ngIf="hasConsentimientoAprobado">
                    <div class="footer-left">
                        <button pButton type="button" label="Anterior" icon="pi pi-arrow-left"
                            severity="secondary" [outlined]="true"
                            [disabled]="submitting || currentStep === 0 || !currentQuestion"
                            (click)="goToPrevStep()"></button>
                    </div>
                    <div class="footer-right">
                        <button *ngIf="!terminatesInterview && !isLastStep" pButton type="button"
                            label="Siguiente" icon="pi pi-arrow-right" iconPos="right"
                            [disabled]="submitting || !currentQuestion"
                            (click)="goToNextStep()"></button>
                        <button *ngIf="terminatesInterview || isLastStep" pButton type="button"
                            [label]="terminatesInterview ? 'Finalizar (terminación temprana)' : 'Finalizar entrevista'"
                            [severity]="terminatesInterview ? 'warn' : 'success'"
                            [loading]="submitting"
                            [disabled]="submitting || !currentQuestion"
                            icon="pi pi-check-circle"
                            (click)="submit()"></button>
                    </div>
                </div>
            </section>

            <!-- ===================== DIALOG: Registro directo ===================== -->
            <p-dialog [(visible)]="directRegistrationVisible" [modal]="true" [draggable]="false"
                [closable]="!directRegistrationLoading"
                [style]="{ width: 'min(52rem, 96vw)' }"
                header="Registrar persona y empezar entrevista"
                styleClass="cies-dialog dialog-registro-directo">
                <div class="dialog-registro-content">
                    <ng-container *ngIf="directRegistrationStep === 'search'">
                        <p class="dialog-intro-text registro-state-panel registro-state-panel--search">
                            Busca primero a la persona por su CI. Si no existe, podr&aacute;s registrarla manualmente.
                        </p>

                        <div class="registro-search-panel registro-state-panel registro-state-panel--search">
                            <label>Documento de identidad</label>
                            <p class="registro-search-help">Ingresa el CI de la persona usando solo n&uacute;meros.</p>
                            <div class="registro-documento-row">
                                <input pInputText [(ngModel)]="directRegistrationForm.documento" class="w-full"
                                    inputmode="numeric" pattern="[0-9]*" maxlength="12"
                                    placeholder="Ejemplo: 12345678"
                                    (ngModelChange)="onDirectDocumentChange($event)"
                                    (keydown)="onNumericIdentityKeydown($event)"
                                    (paste)="onNumericIdentityPaste($event)" />
                                <button pButton type="button" label="Buscar" icon="pi pi-search"
                                    class="registro-documento-buscar"
                                    [loading]="directRegistrationSearchingByCi"
                                    [disabled]="directRegistrationLoading || directRegistrationSearchingByCi"
                                    (click)="buscarPersonaDirectaPorCi()"></button>
                            </div>
                        </div>
                    </ng-container>

                    <ng-container *ngIf="directRegistrationStep === 'not-found'">
                        <div class="registro-empty-search-state registro-state-panel registro-state-panel--not-found">
                            <div class="registro-empty-search-icon">
                                <i class="pi pi-search"></i>
                            </div>
                            <h3>No se encontr&oacute; una persona con ese CI</h3>
                            <p>Revisa el n&uacute;mero ingresado o registra manualmente a la persona con un formulario vac&iacute;o.</p>
                            <div class="registro-empty-search-actions">
                                <button pButton type="button" label="Registrar manualmente" icon="pi pi-user-plus"
                                    (click)="openManualDirectRegistrationForm()"></button>
                                <button pButton type="button" label="Cerrar" severity="secondary" [outlined]="true"
                                    (click)="closeDirectRegistration()"></button>
                            </div>
                        </div>
                    </ng-container>

                    <p class="dialog-intro-text" *ngIf="directRegistrationStep === 'form'">
                        Registra los datos de la persona y el sistema abrirá la entrevista automáticamente.
                    </p>

                    <div class="registro-form-grid" *ngIf="directRegistrationStep === 'form'">
                        <div class="registro-field">
                            <label>Nombre <span class="required-star">*</span></label>
                            <input pInputText [(ngModel)]="directRegistrationForm.nombre" class="w-full"
                                [disabled]="directRegistrationLockedFields.nombre"
                                placeholder="Ejemplo: María" />
                        </div>
                        <div class="registro-field">
                            <label>Apellido <span class="required-star">*</span></label>
                            <input pInputText [(ngModel)]="directRegistrationForm.apellido" class="w-full"
                                [disabled]="directRegistrationLockedFields.apellido"
                                placeholder="Ejemplo: López García" />
                        </div>
                        <div class="registro-field">
                            <label>Documento de identidad</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.documento" class="w-full"
                                [disabled]="directRegistrationLockedFields.documento"
                                inputmode="numeric" pattern="[0-9]*" maxlength="12"
                                placeholder="Ejemplo: 12345678"
                                (ngModelChange)="onDirectDocumentChange($event)"
                                (keydown)="onNumericIdentityKeydown($event)"
                                (paste)="onNumericIdentityPaste($event)" />
                        </div>
                        <div class="registro-field">
                            <label>ID Medicare</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.medicarePersonId" class="w-full"
                                [disabled]="directRegistrationLockedFields.medicarePersonId"
                                placeholder="Opcional, se genera automático si se deja vacío" />
                        </div>
                        <div class="registro-field">
                            <label>Clínica <span class="required-star">*</span></label>
                            <p-select [options]="ciesClinicOptions"
                                [(ngModel)]="directRegistrationForm.clinica"
                                optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                placeholder="Selecciona una clínica"
                                (ngModelChange)="onDirectClinicChange($event)"></p-select>
                        </div>
                        <div class="registro-field">
                            <label>Regional <span class="required-star">*</span></label>
                            <p-select [options]="ciesRegionalOptions"
                                [(ngModel)]="directRegistrationForm.regional"
                                optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                placeholder="Selecciona una ciudad"></p-select>
                        </div>
                        <div class="registro-field">
                            <label>Fecha de consulta <span class="required-star">*</span></label>
                            <input pInputText [(ngModel)]="directRegistrationForm.fechaConsulta" class="w-full"
                                type="date" />
                        </div>
                        <div class="registro-field">
                            <label>Tipo de consulta</label>
                            <p-select [options]="tipoConsultaOptions"
                                [(ngModel)]="directRegistrationForm.tipoConsulta"
                                optionLabel="label" optionValue="value" appendTo="body" class="w-full"
                                placeholder="Selecciona un tipo"></p-select>
                        </div>
                    </div>

                    <div class="cies-note" [ngClass]="directRegistrationLookupNotice.severity === 'error' ? 'cies-note--error' : 'cies-note--warning'"
                        *ngIf="directRegistrationLookupNotice">
                        <div class="registro-lookup-note">
                            <span><i class="pi" [ngClass]="directRegistrationLookupNotice.severity === 'error' ? 'pi-exclamation-triangle' : 'pi-info-circle'"></i> {{ directRegistrationLookupNotice.message }}</span>
                            <button pButton type="button" label="Cerrar" size="small" severity="secondary" text
                                (click)="closeDirectRegistrationLookupNotice()"></button>
                        </div>
                    </div>

                    <div class="cies-note cies-note--error" *ngIf="directRegistrationError">
                        <i class="pi pi-exclamation-triangle"></i> {{ directRegistrationError }}
                    </div>
                </div>

            <ng-template pTemplate="footer">
                <div class="dialog-footer-actions" *ngIf="directRegistrationStep === 'form'; else directRegistrationSearchFooter">
                    <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true"
                            [disabled]="directRegistrationLoading" (click)="closeDirectRegistration()"></button>
                    <button pButton type="button" label="Crear y abrir entrevista"
                        icon="pi pi-arrow-right" [loading]="directRegistrationLoading"
                        [disabled]="directRegistrationLoading || directRegistrationStep !== 'form'"
                        (click)="registerDirectInterview()"></button>
                </div>
            </ng-template>
            <ng-template #directRegistrationSearchFooter>
                <div class="dialog-footer-actions">
                    <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true"
                        [disabled]="directRegistrationLoading || directRegistrationSearchingByCi"
                        (click)="closeDirectRegistration()"></button>
                </div>
            </ng-template>
            </p-dialog>

            <!-- ===================== DIALOG: Confirmar cierre ===================== -->
            <p-dialog [(visible)]="showCloseConfirm" [modal]="true" [closable]="true"
                [style]="{ width: 'min(32rem, 92vw)' }"
                header="¿Cerrar entrevista?"
                styleClass="cies-dialog">
                <div class="close-confirm-content">
                    <p>Estás saliendo de la entrevista. Tus cambios se han guardado y podrás <strong>retomarla desde el mismo punto</strong> al abrirla nuevamente en este dispositivo.</p>
                    <div class="close-confirm-actions">
                        <button pButton type="button" label="Continuar entrevista" icon="pi pi-arrow-left"
                            (click)="showCloseConfirm = false"></button>
                        <button pButton type="button" label="Cerrar entrevista" severity="secondary"
                            [outlined]="true" (click)="closeInterview()"></button>
                    </div>
                </div>
            </p-dialog>

            <p-dialog [(visible)]="finalizadaDetailVisible" [modal]="true" [draggable]="false"
                [style]="{ width: 'min(72rem, 96vw)' }"
                header="Detalle de entrevista finalizada"
                styleClass="cies-dialog">
                <div *ngIf="selectedFinalizadaDetail" class="cies-detail-dialog">
                    <div class="cies-detail-summary">
                        <div>
                            <strong>{{ selectedFinalizadaDetail.personaNombre }}</strong>
                            <span>{{ selectedFinalizadaDetail.codigo }}</span>
                        </div>
                        <div>
                            <span>{{ selectedFinalizadaDetail.clinica }} - {{ selectedFinalizadaDetail.regional }}</span>
                            <span *ngIf="selectedFinalizadaDetail.fechaFin">Finalizada: {{ selectedFinalizadaDetail.fechaFin | fechaCorta }}</span>
                        </div>
                    </div>

                    <div class="cies-detail-flags" *ngIf="canViewSensitiveResults && selectedFinalizadaDetail.resultado">
                        <p-tag [value]="selectedFinalizadaDetail.resultado.pobre ? 'Pobreza' : 'No pobreza'"
                            [severity]="selectedFinalizadaDetail.resultado.pobre ? 'danger' : 'secondary'"></p-tag>
                        <p-tag [value]="selectedFinalizadaDetail.resultado.excluido ? 'Excluida' : 'No excluida'"
                            [severity]="selectedFinalizadaDetail.resultado.excluido ? 'warn' : 'secondary'"></p-tag>
                        <p-tag [value]="selectedFinalizadaDetail.resultado.subatendido ? 'Subatendida' : 'No subatendida'"
                            [severity]="selectedFinalizadaDetail.resultado.subatendido ? 'info' : 'secondary'"></p-tag>
                    </div>

                    <p-table [value]="selectedFinalizadaAnswers" [tableStyle]="{ 'min-width': '100%' }"
                        responsiveLayout="scroll" class="cies-table">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Pregunta</th>
                                <th>Respuesta</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-item>
                            <tr>
                                <td>{{ item.etiqueta }}</td>
                                <td>{{ item.respuesta }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </p-dialog>
        </div>

        <p-toast></p-toast>
    `,
    styles: [`
        ::ng-deep .direct-registration-button.p-button {
            border: none !important;
            color: #ffffff !important;
            background: linear-gradient(135deg, var(--primary-color), #f97316) !important;
            box-shadow: 0 12px 24px rgba(249, 115, 22, 0.24) !important;
            font-weight: 800 !important;
        }

        ::ng-deep .direct-registration-button.p-button:not(:disabled):hover {
            transform: translateY(-1px);
            filter: saturate(1.08);
            box-shadow: 0 16px 30px rgba(249, 115, 22, 0.3) !important;
        }

        ::ng-deep .direct-registration-button--hero.p-button {
            padding: 0.8rem 1.1rem !important;
        }

        .entrevista-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1.5rem;
            padding-bottom: 1rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--surface-border);
            flex-wrap: wrap;
        }

        .entrevista-info {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            flex: 1;
            min-width: 0;
        }

        .entrevista-codigo {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.4rem 0.75rem;
            background: var(--primary-color);
            color: var(--primary-color-text);
            border-radius: 0.5rem;
            font-size: 0.8rem;
            font-weight: 700;
            white-space: nowrap;
        }

        .entrevista-persona h3 {
            margin: 0 0 0.25rem;
            font-size: 1.1rem;
        }

        .entrevista-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.82rem;
            color: var(--text-color-secondary);
        }

        .entrevista-meta span {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        .entrevista-actions {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-end;
            min-width: 14rem;
        }

        .progress-container {
            width: 100%;
        }

        .progress-label {
            display: block;
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            margin-top: 0.25rem;
            text-align: right;
        }

        .draft-status {
            display: block;
            font-size: 0.72rem;
            color: var(--text-color-secondary);
            margin-top: 0.2rem;
            text-align: right;
        }

        .draft-status--error {
            color: #dc2626;
            font-weight: 600;
        }

        .progress-complete + .progress-label {
            color: var(--primary-color);
            font-weight: 600;
        }

        .cies-list-tabs {
            position: relative;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.35rem;
            align-items: stretch;
            padding: 0.35rem;
            border-radius: 1.25rem;
            background: var(--layout-panel-soft-background);
            border: 1px solid var(--layout-border-soft);
            box-shadow:
                inset 0 1px 0 var(--layout-subtle-overlay),
                var(--layout-shadow-soft);
            overflow: hidden;
        }

        .cies-list-tabs__indicator {
            position: absolute;
            top: 0.35rem;
            left: 0.35rem;
            width: calc(50% - 0.35rem);
            height: calc(100% - 0.7rem);
            border-radius: 1rem;
            background: var(--primary-color);
            box-shadow:
                0 10px 24px color-mix(in srgb, var(--primary-color), transparent 70%),
                inset 0 1px 0 rgba(255, 255, 255, 0.35);
            transition:
                transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 0.25s ease;
            will-change: transform;
            pointer-events: none;
        }

        .cies-list-tabs[data-active-tab='finalizadas'] .cies-list-tabs__indicator {
            transform: translateX(100%);
        }

        .cies-list-tab {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 3rem;
            border-radius: 1rem;
            font-weight: 600;
            color: var(--primary-color);
            transition:
                color 0.25s ease,
                transform 0.2s ease,
                opacity 0.2s ease;
        }

        .cies-list-tab:hover {
            transform: translateY(-1px);
        }

        .cies-list-tab--active {
            font-weight: 700;
            color: #ffffff;
        }

        :host ::ng-deep .cies-list-tab.p-button {
            width: 100%;
            border: 0;
            background: transparent;
            box-shadow: none;
            padding: 0.8rem 1rem;
        }

        :host ::ng-deep .cies-list-tab.p-button:not(:disabled):hover {
            background: transparent;
            border: 0;
        }

        :host ::ng-deep .cies-list-tab.p-button:focus-visible {
            box-shadow: none;
            outline: none;
        }

        :host ::ng-deep .cies-list-tab .p-button-label,
        :host ::ng-deep .cies-list-tab .p-button-icon {
            position: relative;
            z-index: 1;
        }

        :host ::ng-deep .cies-list-tab .p-button-icon {
            font-size: 0.95rem;
        }

        :host ::ng-deep .cies-list-tab .p-button-label {
            font-weight: inherit;
        }

        :host ::ng-deep .cies-list-tab.cies-list-tab--active .p-button-label,
        :host ::ng-deep .cies-list-tab.cies-list-tab--active .p-button-icon {
            color: #ffffff;
        }

        .cies-flag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
        }

        .cies-detail-dialog {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .cies-detail-summary {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem;
            padding: 0.85rem 1rem;
            border: 1px solid var(--surface-border);
            border-radius: 0.75rem;
            background: var(--surface-ground);
        }

        .cies-detail-summary div,
        .cies-detail-flags {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
        }

        .entrevista-guide-note {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.6rem 0.85rem;
            background: var(--surface-ground);
            border-radius: 0.5rem;
            border-left: 3px solid var(--primary-color);
            font-size: 0.85rem;
            color: var(--text-color-secondary);
            margin-bottom: 1rem;
        }

        .entrevista-guide-note i {
            color: var(--primary-color);
            margin-top: 0.1rem;
        }

        .consent-card {
            display: flex;
            gap: 1rem;
            align-items: flex-start;
            padding: 1rem 1.1rem;
            margin-bottom: 1rem;
            border: 1px solid color-mix(in srgb, var(--primary-color), transparent 70%);
            border-radius: 0.85rem;
            background: color-mix(in srgb, var(--primary-color), transparent 94%);
        }

        .consent-card__icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-color);
            color: var(--primary-color-text);
            flex-shrink: 0;
        }

        .consent-card__content {
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
        }

        .consent-card__content h4 {
            margin: 0;
            font-size: 1rem;
        }

        .consent-card__content p {
            margin: 0;
            color: var(--text-color-secondary);
            line-height: 1.5;
        }

        .consent-card__actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }

        .preguntas-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin: 1rem 0;
        }

        .question-step {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .question-step__eyebrow {
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--primary-color);
        }

        .question-step__title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--text-color);
            line-height: 1.4;
        }

        .question-card {
            padding: 1rem 1.25rem;
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 0.75rem;
            transition: all 0.2s ease;
        }

        .question-card:hover {
            border-color: var(--primary-color);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .question-card.question-answered {
            border-color: var(--primary-color);
            background: color-mix(in srgb, var(--primary-color), transparent 96%);
        }

        .question-card.question-invalid {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.04);
            animation: shake 0.3s ease;
        }

        .question-card.question-terminates {
            border-color: #f59e0b;
            background: rgba(245, 158, 11, 0.04);
        }

        .question-card.question-skipped {
            opacity: 0.5;
            border-style: dashed;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
        }

        .question-header {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }

        .question-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            background: var(--primary-color);
            color: var(--primary-color-text);
            font-size: 0.8rem;
            font-weight: 700;
            flex-shrink: 0;
            position: relative;
        }

        .question-number-required {
            position: absolute;
            top: -0.45rem;
            right: -0.35rem;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1rem;
            height: 1rem;
            border-radius: 999px;
            background: #dc2626;
            color: #ffffff;
            font-size: 0.9rem;
            line-height: 1;
            font-weight: 900;
            border: 2px solid var(--surface-card);
        }

        .question-card.question-answered .question-number {
            background: var(--primary-color);
        }

        .question-card.question-invalid .question-number {
            background: #ef4444;
        }

        .question-content {
            flex: 1;
            min-width: 0;
        }

        .question-label {
            font-size: 0.92rem;
            font-weight: 600;
            color: var(--text-color);
            display: flex;
            align-items: baseline;
            gap: 0.35rem;
            flex-wrap: wrap;
        }

        .required-marker {
            color: #dc2626;
            font-weight: 900;
            font-size: 1.25rem;
            line-height: 1;
            padding: 0 0.15rem;
            display: inline-block;
        }

        .required-text {
            color: #dc2626;
            font-size: 0.68rem;
            font-weight: 800;
            text-transform: uppercase;
        }

        .question-type-badge {
            font-size: 0.7rem;
            padding: 0.1rem 0.4rem;
            border-radius: 0.3rem;
            background: var(--surface-ground);
            color: var(--text-color-secondary);
            border: 1px solid var(--surface-border);
            text-transform: uppercase;
            font-weight: 600;
        }

        .question-skipped-badge {
            font-size: 0.7rem;
            padding: 0.1rem 0.4rem;
            border-radius: 0.3rem;
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            border: 1px solid rgba(99, 102, 241, 0.3);
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            margin-left: 0.5rem;
        }

        .question-answer {
            margin-top: 0.5rem;
        }

        .opciones-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
            gap: 0.5rem;
        }

        .opciones-grid.opciones-disabled .opcion-card {
            cursor: not-allowed;
            opacity: 0.55;
            pointer-events: none;
        }

        .opcion-card.opcion-disabled {
            cursor: not-allowed;
            opacity: 0.55;
        }

        .otro-input-wrapper {
            margin-top: 0.75rem;
            padding: 0.75rem;
            background: rgba(251, 146, 60, 0.08);
            border: 1px dashed rgba(251, 146, 60, 0.4);
            border-radius: 0.5rem;
        }

        .otro-label {
            display: block;
            font-size: 0.82rem;
            font-weight: 600;
            color: #c2410c;
            margin-bottom: 0.35rem;
        }

        .otro-helper {
            display: block;
            margin-top: 0.35rem;
            color: var(--text-color-secondary);
            font-size: 0.75rem;
            text-align: right;
        }

        .opcion-card {
            width: 100%;
            border: 1.5px solid var(--surface-border);
            appearance: none;
            -webkit-appearance: none;
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.65rem 0.85rem;
            background: var(--surface-ground);
            border-radius: 0.5rem;
            cursor: pointer;
            color: inherit;
            font: inherit;
            text-align: left;
            touch-action: manipulation;
            user-select: none;
            transition: all 0.15s ease;
        }

        .opcion-card:disabled {
            cursor: not-allowed;
        }

        .opcion-card:hover {
            border-color: var(--primary-color);
            background: color-mix(in srgb, var(--primary-color), transparent 92%);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color), transparent 88%);
        }

        .opcion-card.opcion-selected {
            border-color: var(--primary-color);
            background: color-mix(in srgb, var(--primary-color), transparent 86%);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color), transparent 82%);
        }

        .opcion-card.opcion-invalid {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.08);
        }

        .opcion-radio {
            flex-shrink: 0;
        }

        .opcion-radio-circle {
            width: 1.1rem;
            height: 1.1rem;
            border-radius: 50%;
            border: 2px solid var(--text-color-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
        }

        .opcion-radio-circle.checked {
            border-color: var(--primary-color);
            background: var(--primary-color);
        }

        .opcion-radio-circle.checked::after {
            content: '';
            width: 0.45rem;
            height: 0.45rem;
            border-radius: 50%;
            background: var(--primary-color-text);
        }

        .opcion-label {
            font-size: 0.88rem;
            color: var(--text-color);
            flex: 1;
        }

        .opcion-check {
            color: var(--primary-color);
            font-size: 0.9rem;
            flex-shrink: 0;
        }

        .input-texto, .input-texto-largo {
            padding: 0.6rem 0.75rem;
            border-radius: 0.5rem;
            border: 1.5px solid var(--surface-border);
            font-size: 0.9rem;
            transition: all 0.2s ease;
            background: var(--surface-ground);
        }

        .input-texto:focus, .input-texto-largo:focus {
            border-color: var(--primary-color);
            outline: none;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color), transparent 85%);
        }

        .input-texto.input-invalid, .input-texto-largo.input-invalid {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.04);
        }

        .question-logic-hint {
            display: block;
            margin-top: 0.4rem;
            font-size: 0.78rem;
            color: var(--text-color-secondary);
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        .question-error {
            display: block;
            margin-top: 0.4rem;
            font-size: 0.8rem;
            color: #ef4444;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        .cies-note--success {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.65rem 0.85rem;
            background: color-mix(in srgb, var(--primary-color), transparent 92%);
            border: 1px solid color-mix(in srgb, var(--primary-color), transparent 70%);
            border-radius: 0.5rem;
            color: var(--primary-color);
            font-size: 0.88rem;
            margin-bottom: 1rem;
        }

        .entrevista-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding-top: 1rem;
            margin-top: 1rem;
            border-top: 1px solid var(--surface-border);
            flex-wrap: wrap;
        }

        .footer-left, .footer-right {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .footer-right button {
            padding: 0.65rem 1.5rem;
            font-size: 0.95rem;
        }

        ::ng-deep .dialog-registro-directo .p-dialog-content {
            padding: 1.5rem 2rem;
        }

        ::ng-deep .dialog-registro-directo .p-dialog-footer {
            padding: 1rem 2rem 1.25rem;
            border-top: 1px solid var(--surface-border);
        }

        .dialog-registro-content {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .dialog-intro-text {
            color: var(--text-color);
            font-size: 0.9rem;
            line-height: 1.5;
            margin: 0 0 1.5rem;
            padding: 0.75rem 1rem;
            background: var(--surface-ground);
            border-radius: 0.75rem;
            border-left: 3px solid var(--primary-color);
        }

        .registro-form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem 1.5rem;
        }

        .registro-state-panel {
            animation: registro-state-enter 220ms ease-out;
            will-change: transform, opacity;
        }

        .registro-state-panel--not-found {
            animation: registro-state-enter 240ms ease-out;
        }

        .registro-documento-row {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }

        .registro-documento-row .w-full {
            min-width: 0;
            flex: 1 1 auto;
        }

        .registro-documento-buscar {
            flex: 0 0 auto;
            white-space: nowrap;
        }

        .registro-search-panel {
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
            padding: 1rem;
            border: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);
            border-radius: 1rem;
            background: color-mix(in srgb, var(--surface-card) 88%, var(--primary-color) 12%);
        }

        .registro-search-help {
            margin: 0;
            color: var(--text-color-secondary);
            font-size: 0.92rem;
        }

        .registro-empty-search-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.9rem;
            padding: 1.25rem 0.5rem;
        }

        .registro-empty-search-state h3,
        .registro-empty-search-state p {
            margin: 0;
        }

        .registro-empty-search-state p {
            color: var(--text-color-secondary);
            max-width: 32rem;
        }

        .registro-empty-search-icon {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            color: var(--primary-color);
            background: color-mix(in srgb, var(--primary-color) 14%, transparent);
        }

        .registro-empty-search-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.75rem;
        }

        .registro-lookup-note {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
        }

        .registro-lookup-note span {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            line-height: 1.5;
        }

        .registro-field {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .registro-field label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-color);
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .required-star {
            color: #ef4444;
            font-weight: 700;
        }

        .registro-field input,
        .registro-field .p-select {
            margin-top: 0.25rem;
        }

        .registro-field input {
            padding: 0.6rem 0.75rem;
            border-radius: 0.5rem;
            border: 1.5px solid var(--surface-border);
            font-size: 0.9rem;
            transition: border-color 0.2s ease;
        }

        .registro-field input:focus {
            border-color: var(--primary-color);
            outline: none;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color), transparent 82%);
        }

        .dialog-footer-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            width: 100%;
        }

        .dialog-footer-actions button {
            min-width: 10rem;
            padding: 0.6rem 1.25rem;
        }

        @keyframes registro-state-enter {
            from {
                opacity: 0;
                transform: translateY(8px) scale(0.985);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .close-confirm-content {
            text-align: center;
        }

        .close-confirm-content p {
            margin: 0.5rem 0;
            color: var(--text-color-secondary);
        }

        .close-confirm-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            margin-top: 1.25rem;
        }

        @media (max-width: 768px) {
            .cies-list-tabs {
                grid-template-columns: 1fr;
            }

            .cies-list-tabs__indicator {
                width: calc(100% - 0.7rem);
                height: calc(50% - 0.35rem);
            }

            .cies-list-tabs[data-active-tab='finalizadas'] .cies-list-tabs__indicator {
                transform: translateY(100%);
            }

            .cies-detail-summary {
                grid-template-columns: 1fr;
            }

            .entrevista-header {
                flex-direction: column;
                gap: 1rem;
            }

            .entrevista-actions {
                width: 100%;
                min-width: auto;
            }

            .opciones-grid {
                grid-template-columns: 1fr;
            }

            .registro-form-grid {
                grid-template-columns: 1fr;
            }

            .entrevista-footer {
                flex-direction: column;
                align-items: stretch;
            }

            .footer-left, .footer-right {
                justify-content: center;
            }

            .footer-right button {
                width: 100%;
            }

            .dialog-footer-actions {
                flex-direction: column;
            }

            .dialog-footer-actions button {
                width: 100%;
                min-width: 0;
            }

            ::ng-deep .dialog-registro-directo .p-dialog-content {
                padding: 1rem;
            }

            ::ng-deep .dialog-registro-directo .p-dialog-footer {
                padding: 0.85rem 1rem 1rem;
            }

            .close-confirm-actions {
                flex-direction: column;
            }
        }

        @media (max-width: 480px) {
            .question-header {
                flex-direction: column;
                gap: 0.5rem;
            }

            .question-number {
                width: 1.5rem;
                height: 1.5rem;
                font-size: 0.7rem;
            }

            .question-label {
                font-size: 0.85rem;
            }
        }
    `]
})
export class EntrevistasPage implements OnInit {
    readonly OTRO_MAX_LENGTH = 120;
    readonly DRAFT_STORAGE_PREFIX = 'cies-interview-draft';

    private authService = inject(AuthService);
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);
    private draftSaveTimer: ReturnType<typeof setTimeout> | null = null;

    pendientes: PersonaElegible[] = [];
    currentStep = 0;
    currentInterview: Entrevista | null = null;
    answers: Record<number, AnswerValue> = {};
    showValidation = false;
    submitting = false;
    loadingPendientes = false;
    startingPersonaId: number | null = null;
    directRegistrationVisible = false;
    directRegistrationLoading = false;
    directRegistrationError = '';
    directRegistrationSearchingByCi = false;
    directRegistrationLookupNotice: DirectRegistrationLookupNotice | null = null;
    directRegistrationStep: DirectRegistrationStep = 'search';
    directRegistrationLockedFields: DirectRegistrationLockedFields = this.createDirectRegistrationLockedFields();
    directRegistrationLockedSnapshot: DirectRegistrationLockedSnapshot = this.createDirectRegistrationLockedSnapshot();
    showCloseConfirm = false;
    searchTerm = '';
    selectedEstado = '';
    selectedClinica = '';
    selectedLote = '';
    activeListTab: 'pendientes' | 'finalizadas' = 'pendientes';
    filteredPendientesList: PersonaElegible[] = [];
    finalizadas: EntrevistaFinalizadaResumen[] = [];
    filteredFinalizadas: EntrevistaFinalizadaResumen[] = [];
    finalizadasSearchTerm = '';
    loadingFinalizadas = false;
    loadingFinalizadaDetalleId: number | null = null;
    finalizadaDetailVisible = false;
    selectedFinalizadaDetail: Entrevista | null = null;
    draftStatus: 'idle' | 'saved' | 'error' = 'idle';
    draftUpdatedAt: string | null = null;
    consentimientoAceptado = false;

    readonly estadoOptions = [
        { label: 'Todos', value: '' },
        { label: 'Por iniciar', value: 'PENDIENTE' },
        { label: 'En curso', value: 'EN_CURSO' }
    ];

    readonly tipoConsultaOptions = [
        { label: 'Primera consulta SSR', value: 'PRIMERA_CONSULTA_SSR' },
        { label: 'Consulta general', value: 'CONSULTA_GENERAL' },
        { label: 'Control', value: 'CONTROL' }
    ];

    readonly ciesRegionalOptions = [
        { label: 'Cochabamba', value: 'Cochabamba' },
        { label: 'El Alto', value: 'El Alto' },
        { label: 'La Paz', value: 'La Paz' },
        { label: 'Oruro', value: 'Oruro' },
        { label: 'Pando', value: 'Pando' },
        { label: 'Potosí', value: 'Potosí' },
        { label: 'Riberalta', value: 'Riberalta' },
        { label: 'Santa Cruz', value: 'Santa Cruz' },
        { label: 'Sucre', value: 'Sucre' },
        { label: 'Tarija', value: 'Tarija' }
    ];

    readonly ciesClinicOptions = [
        { label: 'CIES Cochabamba', value: 'CIES Cochabamba', regional: 'Cochabamba' },
        { label: 'CIES El Alto', value: 'CIES El Alto', regional: 'El Alto' },
        { label: 'CIES La Paz', value: 'CIES La Paz', regional: 'La Paz' },
        { label: 'CIES Oruro', value: 'CIES Oruro', regional: 'Oruro' },
        { label: 'CIES Pando', value: 'CIES Pando', regional: 'Pando' },
        { label: 'CIES Potosí', value: 'CIES Potosí', regional: 'Potosí' },
        { label: 'CIES Riberalta', value: 'CIES Riberalta', regional: 'Riberalta' },
        { label: 'CIES Santa Cruz', value: 'CIES Santa Cruz', regional: 'Santa Cruz' },
        { label: 'CIES Sucre', value: 'CIES Sucre', regional: 'Sucre' },
        { label: 'CIES Tarija', value: 'CIES Tarija', regional: 'Tarija' }
    ];

    directRegistrationForm = this.createDirectRegistrationForm();

    get isAdmin(): boolean {
        return this.authService.isAdministrador();
    }

    get isEncuestador(): boolean {
        return this.authService.isEncuestador();
    }

    get canViewSensitiveResults(): boolean {
        return !this.isEncuestador;
    }

    get draftStatusLabel(): string {
        if (this.draftStatus === 'error') {
            return 'No se pudo guardar el borrador';
        }
        if (this.draftStatus === 'saved') {
            const suffix = this.draftUpdatedAt ? ` · ${this.draftUpdatedAt}` : '';
            return `Guardado parcial${suffix}`;
        }
        return 'Los cambios se guardan automáticamente en este dispositivo';
    }

    get isInterviewActionBusy(): boolean {
        return this.loadingPendientes || this.startingPersonaId !== null || this.directRegistrationLoading || this.submitting;
    }

    get hasConsentimientoAprobado(): boolean {
        return this.consentimientoAceptado;
    }

    get visibleQuestions(): PreguntaInstrumento[] {
        return this.getFilteredVisibleQuestions();
    }

    get terminatesInterview(): boolean {
        return !!this.getTerminationRule();
    }

    get terminationMessage(): string {
        const rule = this.getTerminationRule();
        if (!rule) {
            return 'Según la regla del instrumento, la entrevista finaliza en esta pregunta.';
        }
        if (rule.codigoVariable === 'CONSULTA_PARA') {
            return 'La consulta fue registrada para otra persona. Según la regla del instrumento, la entrevista finaliza en esta pregunta.';
        }
        if (rule.codigoVariable === 'SERVICIO') {
            return 'Se seleccionó "Otro" en el servicio de consulta. Según la regla del instrumento, la entrevista finaliza en esta pregunta.';
        }
        return 'Según la regla del instrumento, la entrevista finaliza en esta pregunta.';
    }

    get validationErrors(): ValidationError[] {
        return this.visibleQuestions
            .filter((q) => !this.shouldSkipQuestion(q))
            .filter((q) => q.obligatoria && !this.isQuestionAnswered(q))
            .map((q) => ({
                preguntaId: q.id,
                codigoVariable: q.codigoVariable,
                etiqueta: q.etiqueta,
                mensaje: `Pregunta ${q.numeroVisible} es obligatoria`
            }));
    }

    get answerableQuestions(): PreguntaInstrumento[] {
        return this.visibleQuestions.filter((q) => !this.shouldSkipQuestion(q));
    }

    get answeredCount(): number {
        return this.answerableQuestions.filter((q) => this.isQuestionAnswered(q)).length;
    }

    get progressPercent(): number {
        return this.totalSteps > 0 ? Math.round((this.stepProgress / this.totalSteps) * 100) : 0;
    }

    get selectedFinalizadaAnswers(): Array<{ etiqueta: string; respuesta: string }> {
        return (this.selectedFinalizadaDetail?.respuestas || []).map((item) => ({
            etiqueta: item.etiqueta,
            respuesta: item.etiquetaRespuesta || item.valorOtro || item.valorCrudo || 'Sin respuesta'
        }));
    }

    get clinicaOptions(): Array<{ label: string; value: string }> {
        const values = Array.from(new Set(this.pendientes.map((i) => i.clinica).filter(Boolean)))
            .sort((a, b) => a.localeCompare(b));
        return [{ label: 'Todas', value: '' }, ...values.map((v) => ({ label: v, value: v }))];
    }

    get loteOptions(): Array<{ label: string; value: string }> {
        const values = Array.from(new Set(this.pendientes.map((i) => i.loteNombre || 'Sin listado').filter(Boolean)))
            .sort((a, b) => a.localeCompare(b));
        return [{ label: 'Todos', value: '' }, ...values.map((v) => ({ label: v, value: v }))];
    }

    private applyPendingFilters(): void {
        const search = this.normalizeText(this.searchTerm);
        const searchTokens = search.split(' ').filter(Boolean);
        this.filteredPendientesList = this.pendientes
            .filter((i) => !this.selectedEstado || i.estadoEntrevista === this.selectedEstado)
            .filter((i) => !this.isAdmin || !this.selectedClinica || i.clinica === this.selectedClinica)
            .filter((i) => !this.isAdmin || !this.selectedLote || (i.loteNombre || 'Sin listado') === this.selectedLote)
            .filter((i) => {
                if (!searchTokens.length) return true;
                const haystack = this.normalizeText(
                    [i.nombreCompleto, i.documento, i.codigoEntrevista, i.clinica, i.regional, i.loteNombre, i.medicarePersonId].filter(Boolean).join(' ')
                );
                return searchTokens.every((token) => haystack.includes(token));
            })
            .sort((a, b) => {
                const loteCompare = (a.loteNombre || '').localeCompare(b.loteNombre || '');
                if (loteCompare !== 0) return loteCompare;
                return (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '');
            });
    }

    ngOnInit(): void {
        this.loadPendientes();
    }

    setActiveListTab(tab: 'pendientes' | 'finalizadas'): void {
        this.activeListTab = tab;
        if (tab === 'finalizadas' && !this.finalizadas.length && !this.loadingFinalizadas) {
            this.loadFinalizadas();
        }
    }

    loadPendientes(forceRefresh = false): void {
        if (this.loadingPendientes) return;

        this.loadingPendientes = true;
        this.ciesService.getPendientesEntrevista(forceRefresh).subscribe({
            next: (response) => {
                this.loadingPendientes = false;
                this.pendientes = response;
                this.applyPendingFilters();
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loadingPendientes = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(err, 'No se pudieron cargar las personas pendientes.')
                });
                console.error('Error loading pendientes:', err);
            }
        });
    }

    loadFinalizadas(): void {
        if (this.loadingFinalizadas) return;

        this.loadingFinalizadas = true;
        this.ciesService.getFinalizadasEntrevista().subscribe({
            next: (response) => {
                this.loadingFinalizadas = false;
                this.finalizadas = response || [];
                this.applyFinalizadasFilter();
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loadingFinalizadas = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(err, 'No se pudieron cargar las entrevistas finalizadas.')
                });
                console.error('Error loading finalizadas:', err);
            }
        });
    }

    start(item: PersonaElegible): void {
        if (this.startingPersonaId !== null || this.submitting || this.directRegistrationLoading) return;

        this.startingPersonaId = item.id;
        this.ciesService.iniciarEntrevista(item.id).subscribe({
            next: (response) => {
                this.startingPersonaId = null;
                this.currentInterview = response;
                this.currentStep = 0;
                this.showValidation = false;
                this.answers = {};
                this.consentimientoAceptado = !!response.consentimientoAceptado;
                this.submitting = false;

                response.preguntas
                    .filter((q) => !q.metadato)
                    .forEach((q) => {
                        const saved = response.respuestas.find((a) => a.preguntaId === q.id);
                        this.answers[q.id] = {
                            codigoOpcion: this.isOptionQuestion(q) ? (saved?.valorCrudo || '') : '',
                            valorTexto: this.isOptionQuestion(q) ? '' : (saved?.valorCrudo || ''),
                            valorOtro: (saved?.valorOtro || '').slice(0, this.OTRO_MAX_LENGTH)
                        };
                    });

                this.restoreDraftFromLocalStorage(response);

                this.cdr.detectChanges();
                setTimeout(() => {
                    document.querySelector('.entrevista-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            },
            error: (err) => {
                this.startingPersonaId = null;
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo iniciar la entrevista',
                    detail: this.extractErrorMessage(err, 'Intenta nuevamente o verifica tu conexión.')
                });
                console.error('Error starting interview:', err);
            }
        });
    }

    confirmClose(): void {
        const hasAnswers = this.answeredCount > 0;
        if (hasAnswers && !this.submitting) {
            this.showCloseConfirm = true;
        } else {
            this.closeInterview();
        }
    }

    closeInterview(): void {
        if (this.draftSaveTimer) {
            clearTimeout(this.draftSaveTimer);
            this.draftSaveTimer = null;
        }
        this.currentInterview = null;
        this.currentStep = 0;
        this.showValidation = false;
        this.answers = {};
        this.consentimientoAceptado = false;
        this.showCloseConfirm = false;
        this.submitting = false;
        this.startingPersonaId = null;
        this.draftStatus = 'idle';
        this.draftUpdatedAt = null;
        this.cdr.detectChanges();
    }

    isOptionQuestion(question: PreguntaInstrumento): boolean {
        const tipo = (question?.tipo || '').toUpperCase();
        return tipo === 'OPCION_UNICA' || tipo === 'OPCION_MULTIPLE' || tipo === 'BOOLEANO' || tipo === 'BOOLEANA';
    }

    isOtroOption(question: PreguntaInstrumento, codigo: string | undefined): boolean {
        if (!codigo) return false;
        const opcion = question.opciones?.find((o) => o.codigo === codigo);
        if (!opcion) return false;
        const etiqueta = (opcion.etiqueta || '').toLowerCase().trim();
        return etiqueta === 'otro' || etiqueta === 'otra' || etiqueta.startsWith('otro ') || etiqueta.startsWith('otra ');
    }

    isCurrentSelectedOtro(question: PreguntaInstrumento): boolean {
        const answer = this.answers[question.id];
        return !!answer && this.isOtroOption(question, answer.codigoOpcion);
    }

    isTerminationOption(question: PreguntaInstrumento, codigoOpcion: string | undefined): boolean {
        if (!codigoOpcion) {
            return false;
        }
        return (question.codigoVariable === 'CONSULTA_PARA' && codigoOpcion === '2')
            || (question.codigoVariable === 'SERVICIO' && codigoOpcion === '7');
    }

    getOtroLabel(question: PreguntaInstrumento): string {
        return question.codigoVariable === 'SERVICIO'
            ? 'Especifica a qué servicio viene'
            : 'Especifica la opción seleccionada';
    }

    getOtroPlaceholder(question: PreguntaInstrumento): string {
        return question.codigoVariable === 'SERVICIO'
            ? 'Ej.: control, laboratorio, consulta externa...'
            : 'Describe la opción...';
    }

    getOtroLength(preguntaId: number): number {
        return (this.answers[preguntaId]?.valorOtro || '').length;
    }

    onOtroChange(preguntaId: number, value: string): void {
        if (!this.answers[preguntaId]) {
            this.answers[preguntaId] = {};
        }
        this.answers[preguntaId].valorOtro = (value || '').slice(0, this.OTRO_MAX_LENGTH);
        this.onAnswerChange();
    }

    isQuestionAnswered(question: PreguntaInstrumento): boolean {
        const answer = this.answers[question.id];
        if (!answer) return false;
        if (this.isOptionQuestion(question)) {
            if (!answer.codigoOpcion) return false;
            if (this.isOtroOption(question, answer.codigoOpcion)
                && !this.isTerminationOption(question, answer.codigoOpcion)
                && !answer.valorOtro?.trim()) {
                return false;
            }
            return true;
        }
        return !!answer.valorTexto?.trim();
    }

    isQuestionInvalid(question: PreguntaInstrumento): boolean {
        if (!question.obligatoria) return false;
        if (this.shouldSkipQuestion(question)) return false;
        if (this.showValidation) {
            return !this.isQuestionAnswered(question);
        }
        return false;
    }

    isTerminationQuestion(question: PreguntaInstrumento): boolean {
        const rule = this.getTerminationRule();
        return !!rule && question.codigoVariable === rule.codigoVariable;
    }

    getSkipLogic(question: PreguntaInstrumento): string | null {
        if (question.codigoVariable === 'IDIOMA_NINEZ' && this.getAnswerByCode('JEFE_TRABAJO') === '2') {
            return 'Se omite porque se indicó que no hay jefe del hogar/esposo.';
        }
        return null;
    }

    getAnswerByCode(codigoVariable: string): string | null {
        const question = this.currentInterview?.preguntas.find(q => q.codigoVariable === codigoVariable);
        if (!question) return null;
        const answer = this.answers[question.id];
        return answer?.codigoOpcion || null;
    }

    shouldSkipQuestion(question: PreguntaInstrumento): boolean {
        if (question.codigoVariable === 'IDIOMA_NINEZ') {
            return this.getAnswerByCode('JEFE_TRABAJO') === '2';
        }
        return false;
    }

    getFilteredVisibleQuestions(): PreguntaInstrumento[] {
        const questions = (this.currentInterview?.preguntas || [])
            .filter((item) => !item.metadato);

        const questionsWithoutSkipped = questions.filter((item) => !this.shouldSkipQuestion(item));

        if (!this.terminatesInterview) {
            return questionsWithoutSkipped;
        }
        const rule = this.getTerminationRule();
        const pivot = !rule ? null : questionsWithoutSkipped.find((item) => item.codigoVariable === rule.codigoVariable);
        return pivot ? questionsWithoutSkipped.filter((item) => item.orden <= pivot.orden) : questionsWithoutSkipped;
    }

    get currentQuestion(): PreguntaInstrumento | null {
        const questions = this.visibleQuestions;
        if (questions.length === 0) return null;
        return questions[this.currentStep] || questions[questions.length - 1];
    }

    get totalSteps(): number {
        return this.visibleQuestions.length;
    }

    get isLastStep(): boolean {
        return this.totalSteps > 0 && this.currentStep >= this.totalSteps - 1;
    }

    get stepProgress(): number {
        return this.totalSteps > 0 ? this.currentStep + 1 : 0;
    }

    get stepPercent(): number {
        return this.totalSteps > 0 ? Math.round((this.currentStep / this.totalSteps) * 100) : 0;
    }

    goToNextStep(): void {
        const question = this.currentQuestion;
        if (!question) {
            return;
        }

        this.showValidation = true;
        if (question.obligatoria && this.isQuestionInvalid(question)) {
            this.cdr.detectChanges();
            setTimeout(() => {
                document.querySelector('.question-step')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.showValidation = false;
            this.scheduleDraftSave();
            this.cdr.detectChanges();
            setTimeout(() => {
                document.querySelector('.question-step')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    goToPrevStep(): void {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.scheduleDraftSave();
            this.cdr.detectChanges();
            setTimeout(() => {
                document.querySelector('.question-step')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    resetStep(): void {
        this.currentStep = 0;
    }

    selectOpcion(preguntaId: number, codigo: string): void {
        if (!this.answers[preguntaId]) {
            this.answers[preguntaId] = {};
        }

        // Toggle: hacer clic en la opción ya seleccionada la deselecciona
        if (this.answers[preguntaId].codigoOpcion === codigo) {
            this.answers[preguntaId].codigoOpcion = '';
            this.answers[preguntaId].valorOtro = '';
        } else {
            this.answers[preguntaId].codigoOpcion = codigo;
            const question = this.currentInterview?.preguntas.find((q) => q.id === preguntaId);
            if (question && (!this.isOtroOption(question, codigo) || this.isTerminationOption(question, codigo))) {
                this.answers[preguntaId].valorOtro = '';
            }
        }
        this.onAnswerChange();
    }

    onAnswerChange(): void {
        const lastIndex = Math.max(this.visibleQuestions.length - 1, 0);
        if (this.currentStep > lastIndex) {
            this.currentStep = lastIndex;
        }
        this.scheduleDraftSave();
        this.cdr.detectChanges();
    }

    acceptConsent(): void {
        this.consentimientoAceptado = true;
        this.showValidation = false;
        this.scheduleDraftSave();
        this.cdr.detectChanges();
    }

    rejectConsent(): void {
        this.consentimientoAceptado = false;
        this.showValidation = false;
        this.scheduleDraftSave();
        this.messageService.add({
            severity: 'info',
            summary: 'Entrevista detenida',
            detail: 'La entrevista no puede continuar sin consentimiento informado.'
        });
        this.cdr.detectChanges();
    }

    private scheduleDraftSave(): void {
        if (!this.currentInterview) {
            return;
        }
        if (this.draftSaveTimer) {
            clearTimeout(this.draftSaveTimer);
        }
        this.draftSaveTimer = setTimeout(() => {
            this.persistDraftToLocalStorage();
        }, 400);
    }

    private persistDraftToLocalStorage(): void {
        if (!this.currentInterview) {
            return;
        }

        try {
            const snapshot: InterviewDraftSnapshot = {
                interviewId: this.currentInterview.id,
                userId: this.getCurrentUserDraftId(),
                currentStep: this.currentStep,
                consentimientoAceptado: this.consentimientoAceptado,
                answers: this.answers,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.getDraftStorageKey(this.currentInterview.id), JSON.stringify(snapshot));
            this.draftStatus = 'saved';
            this.draftUpdatedAt = this.formatDraftTimestamp(snapshot.updatedAt);
        } catch (error) {
            this.draftStatus = 'error';
            console.error('Error saving interview draft locally:', error);
        } finally {
            this.draftSaveTimer = null;
        }
    }

    private restoreDraftFromLocalStorage(interview: Entrevista): void {
        const raw = localStorage.getItem(this.getDraftStorageKey(interview.id));
        if (!raw) {
            this.draftStatus = 'idle';
            this.draftUpdatedAt = null;
            return;
        }

        try {
            const snapshot = JSON.parse(raw) as InterviewDraftSnapshot;
            if (String(snapshot.userId) !== String(this.getCurrentUserDraftId()) || snapshot.interviewId !== interview.id) {
                return;
            }

            this.answers = {
                ...this.answers,
                ...(snapshot.answers || {})
            };
            this.consentimientoAceptado = !!snapshot.consentimientoAceptado;
            const maxStep = Math.max(this.visibleQuestions.length - 1, 0);
            this.currentStep = Math.max(0, Math.min(snapshot.currentStep ?? 0, maxStep));
            this.draftStatus = 'saved';
            this.draftUpdatedAt = this.formatDraftTimestamp(snapshot.updatedAt);
        } catch (error) {
            this.draftStatus = 'error';
            console.error('Error restoring interview draft locally:', error);
        }
    }

    private clearDraftFromLocalStorage(interviewId: number): void {
        localStorage.removeItem(this.getDraftStorageKey(interviewId));
        this.draftStatus = 'idle';
        this.draftUpdatedAt = null;
        if (this.draftSaveTimer) {
            clearTimeout(this.draftSaveTimer);
            this.draftSaveTimer = null;
        }
    }

    private getDraftStorageKey(interviewId: number): string {
        return `${this.DRAFT_STORAGE_PREFIX}:${this.getCurrentUserDraftId()}:${interviewId}`;
    }

    private getCurrentUserDraftId(): string {
        const user = this.authService.getUser();
        return user?.id != null ? String(user.id) : String(user?.email || 'anon');
    }

    private formatDraftTimestamp(value: string | null | undefined): string | null {
        if (!value) {
            return null;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    private getTerminationRule(): { codigoVariable: string; codigoOpcion: string } | null {
        const rules = [
            { codigoVariable: 'CONSULTA_PARA', codigoOpcion: '2' },
            { codigoVariable: 'SERVICIO', codigoOpcion: '7' }
        ];

        for (const rule of rules) {
            const question = this.currentInterview?.preguntas.find((item) => item.codigoVariable === rule.codigoVariable);
            if (question && this.answers[question.id]?.codigoOpcion === rule.codigoOpcion) {
                return rule;
            }
        }

        return null;
    }

    buildPayload(): FinalizarEntrevistaPayload {
        const respuestas: RespuestaPayload[] = this.visibleQuestions
            .filter((q) => !this.shouldSkipQuestion(q))
            .map((q) => {
                const answer = this.answers[q.id] || {};
                return {
                    preguntaId: q.id,
                    codigoOpcion: answer.codigoOpcion,
                    valorTexto: answer.valorTexto,
                    valorOtro: this.isOtroOption(q, answer.codigoOpcion) && !this.isTerminationOption(q, answer.codigoOpcion)
                        ? (answer.valorOtro || '').trim().slice(0, this.OTRO_MAX_LENGTH)
                        : undefined
                };
            });

        return {
            consentimientoAceptado: this.consentimientoAceptado,
            respuestas
        };
    }

    submit(): void {
        if (!this.currentInterview || this.submitting) return;

        if (!this.hasConsentimientoAprobado) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Falta consentimiento',
                detail: 'Debes registrar el consentimiento informado antes de finalizar la entrevista.'
            });
            return;
        }

        this.showValidation = true;
        if (this.validationErrors.length) {
            setTimeout(() => {
                const firstError = document.querySelector('.question-invalid');
                firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            this.cdr.detectChanges();
            this.messageService.add({
                severity: 'warn',
                summary: 'Faltan respuestas obligatorias',
                detail: `Tienes ${this.validationErrors.length} pregunta(s) obligatoria(s) sin responder.`
            });
            return;
        }

        this.submitting = true;
        this.ciesService.finalizarEntrevista(this.currentInterview.id, this.buildPayload()).subscribe({
            next: () => {
                this.submitting = false;
                this.clearDraftFromLocalStorage(this.currentInterview!.id);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Entrevista finalizada',
                    detail: 'La entrevista se guardó exitosamente. Los resultados fueron procesados.'
                });
                this.closeInterview();
                this.loadFinalizadas();
                this.loadPendientes(true);
            },
            error: (err) => {
                this.submitting = false;
                console.error('Error submitting interview:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'No se pudo finalizar',
                    detail: this.extractErrorMessage(err, 'Ocurrió un error al finalizar la entrevista.')
                });
            }
        });
    }

    openDirectRegistration(): void {
        if (this.isInterviewActionBusy) return;

        this.directRegistrationVisible = true;
        this.directRegistrationError = '';
        this.cdr.detectChanges();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedEstado = '';
        this.selectedClinica = '';
        this.selectedLote = '';
        this.applyPendingFilters();
        this.cdr.detectChanges();
    }

    onSearchTermChange(value: string): void {
        this.searchTerm = value ?? '';
        this.applyPendingFilters();
        this.cdr.detectChanges();
    }

    onEstadoChange(value: string): void {
        this.selectedEstado = value ?? '';
        this.applyPendingFilters();
        this.cdr.detectChanges();
    }

    onClinicaChange(value: string): void {
        this.selectedClinica = value ?? '';
        this.applyPendingFilters();
        this.cdr.detectChanges();
    }

    onLoteChange(value: string): void {
        this.selectedLote = value ?? '';
        this.applyPendingFilters();
        this.cdr.detectChanges();
    }

    onFinalizadasSearchChange(value: string): void {
        this.finalizadasSearchTerm = value ?? '';
        this.applyFinalizadasFilter();
        this.cdr.detectChanges();
    }

    onDirectDocumentChange(value: string): void {
        const normalizado = this.normalizeIdentityDocument(value);
        if (this.directRegistrationForm.documento !== normalizado) {
            this.directRegistrationForm.documento = normalizado;
        }
        if (this.directRegistrationLookupNotice && this.directRegistrationStep === 'search') {
            this.directRegistrationLookupNotice = null;
        }
    }

    onNumericIdentityKeydown(event: KeyboardEvent): void {
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }

        const allowedKeys = new Set([
            'Backspace',
            'Delete',
            'Tab',
            'Escape',
            'Enter',
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Home',
            'End'
        ]);

        if (allowedKeys.has(event.key) || /^\d$/.test(event.key)) {
            return;
        }

        event.preventDefault();
    }

    onNumericIdentityPaste(event: ClipboardEvent): void {
        const pastedText = event.clipboardData?.getData('text') ?? '';
        if (/^\d*$/.test(pastedText)) {
            return;
        }

        event.preventDefault();
    }

    onDirectClinicChange(value: string): void {
        const seleccion = this.ciesClinicOptions.find((item) => item.value === value);
        if (seleccion) {
            this.directRegistrationForm.regional = seleccion.regional;
        }
    }

    buscarPersonaDirectaPorCi(): void {
        if (this.directRegistrationSearchingByCi) return;

        const documento = (this.directRegistrationForm.documento || '').trim();
        if (!/^\d+$/.test(documento)) {
            this.directRegistrationLookupNotice = {
                severity: 'error',
                message: 'Ingrese un CI valido. El CI debe contener solo numeros, sin espacios, guiones ni letras de extension.'
            };
            this.cdr.detectChanges();
            return;
        }

        this.directRegistrationSearchingByCi = true;
        this.directRegistrationLookupNotice = null;
        this.directRegistrationError = '';

        this.ciesService.buscarPersonaPorCi(documento).subscribe({
            next: (response) => {
                this.directRegistrationSearchingByCi = false;
                this.directRegistrationForm.documento = response.documento || documento;

                if (!response.encontrado) {
                    this.directRegistrationStep = 'not-found';
                    this.directRegistrationLookupNotice = null;
                    this.cdr.detectChanges();
                    return;
                }

                this.applyDirectRegistrationLookup(response);
                this.cdr.detectChanges();
            },
            error: () => {
                this.directRegistrationSearchingByCi = false;
                this.directRegistrationLookupNotice = {
                    severity: 'error',
                    message: 'No se pudo realizar la busqueda en este momento. Intente nuevamente.'
                };
                this.cdr.detectChanges();
            }
        });
    }

    closeDirectRegistrationLookupNotice(): void {
        this.directRegistrationLookupNotice = null;
        this.cdr.detectChanges();
    }

    openManualDirectRegistrationForm(): void {
        this.directRegistrationStep = 'form';
        this.directRegistrationLookupNotice = null;
        this.directRegistrationLockedFields = this.createDirectRegistrationLockedFields();
        this.directRegistrationLockedSnapshot = this.createDirectRegistrationLockedSnapshot();
        this.cdr.detectChanges();
    }

    closeDirectRegistration(): void {
        if (this.directRegistrationLoading) return;

        this.directRegistrationVisible = false;
        this.directRegistrationError = '';
        this.directRegistrationSearchingByCi = false;
        this.directRegistrationLookupNotice = null;
        this.directRegistrationStep = 'search';
        this.directRegistrationLockedFields = this.createDirectRegistrationLockedFields();
        this.directRegistrationLockedSnapshot = this.createDirectRegistrationLockedSnapshot();
        this.directRegistrationForm = this.createDirectRegistrationForm();
        this.cdr.detectChanges();
    }

    async registerDirectInterview(): Promise<void> {
        if (this.directRegistrationLoading) return;

        this.directRegistrationError = '';

        if (this.directRegistrationStep !== 'form') {
            this.directRegistrationError = 'Busca primero a la persona por CI o abre el registro manual antes de continuar.';
            this.cdr.detectChanges();
            return;
        }

        const nombre = this.directRegistrationForm.nombre.trim();
        const apellido = this.directRegistrationForm.apellido.trim();
        const clinica = this.directRegistrationForm.clinica.trim();
        const regional = this.directRegistrationForm.regional.trim();
        const documento = this.normalizeIdentityDocument(this.directRegistrationForm.documento);

        if (!this.hasValidDirectRegistrationLockedValues()) {
            this.directRegistrationError = 'Los campos recuperados desde la base de datos no pueden modificarse.';
            this.cdr.detectChanges();
            return;
        }

        if (!nombre || !apellido || !clinica || !regional || !this.directRegistrationForm.fechaConsulta) {
            this.directRegistrationError = 'Completa nombre, apellido, clínica, regional y fecha de consulta.';
            this.cdr.detectChanges();
            return;
        }

        const personaPayload: Record<string, unknown> = {
            medicarePersonId: this.directRegistrationForm.medicarePersonId.trim() || `DIRECTO-${Date.now()}`,
            nombre,
            apellido,
            nombreCompleto: `${nombre} ${apellido}`.trim(),
            ci: documento,
            documento,
            clinica,
            regional,
            fechaConsulta: this.directRegistrationForm.fechaConsulta,
            tipoConsulta: this.directRegistrationForm.tipoConsulta
        };

        const loteNombre = `Registro directo - ${nombre} ${apellido}`.trim();
        this.directRegistrationLoading = true;

        try {
            const lote = await firstValueFrom(this.ciesService.createLote(loteNombre, [personaPayload]));
            const ejecucion = await firstValueFrom(this.ciesService.executeSeleccion(lote.id, `DIRECTO-${Date.now()}`));
            const persona = ejecucion.seleccionadas && ejecucion.seleccionadas[0];

            this.directRegistrationLoading = false;
            this.directRegistrationVisible = false;
            this.directRegistrationError = '';
            this.directRegistrationStep = 'search';
            this.directRegistrationLockedFields = this.createDirectRegistrationLockedFields();
            this.directRegistrationLockedSnapshot = this.createDirectRegistrationLockedSnapshot();
            this.directRegistrationForm = this.createDirectRegistrationForm();
            this.messageService.add({
                severity: 'success',
                summary: 'Registro exitoso',
                detail: `${nombre} ${apellido} fue registrado/a correctamente.`
            });
            this.loadPendientes(true);

            if (persona) {
                this.start(persona);
            } else {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Selección incompleta',
                    detail: 'Se creó el registro pero no fue seleccionado automáticamente. Verifica el límite regional.'
                });
                this.cdr.detectChanges();
            }
        } catch (err) {
            this.directRegistrationLoading = false;
            this.directRegistrationError = this.extractErrorMessage(err, 'No se pudo crear y abrir la entrevista para esta persona.');
            this.messageService.add({
                severity: 'error',
                summary: 'Error al registrar',
                detail: this.directRegistrationError
            });
            console.error('Error creating direct registration:', err);
            this.cdr.detectChanges();
        }
    }

    getQuestionTypeLabel(tipo: string): string {
        const map: Record<string, string> = {
            'OPCION_UNICA': 'Opción única',
            'BOOLEANO': 'Sí/No',
            'TEXTO': 'Texto',
            'TEXTO_LARGO': 'Texto largo',
            'FECHA_HORA': 'Fecha/Hora',
            'NUMERICO': 'Numérico'
        };
        return map[tipo] || tipo;
    }

    isDirectRegistration(item: PersonaElegible): boolean {
        return (item.loteNombre || '').toLowerCase().startsWith('registro directo');
    }

    openFinalizadaDetalle(item: EntrevistaFinalizadaResumen): void {
        if (this.loadingFinalizadaDetalleId !== null) return;

        this.loadingFinalizadaDetalleId = item.entrevistaId;
        this.ciesService.getEntrevista(item.entrevistaId).subscribe({
            next: (response) => {
                this.loadingFinalizadaDetalleId = null;
                this.selectedFinalizadaDetail = response;
                this.finalizadaDetailVisible = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loadingFinalizadaDetalleId = null;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(err, 'No se pudo cargar el detalle de la entrevista finalizada.')
                });
                console.error('Error loading finalizada detail:', err);
            }
        });
    }

    private applyFinalizadasFilter(): void {
        const search = this.normalizeText(this.finalizadasSearchTerm);
        const tokens = search.split(' ').filter(Boolean);
        this.filteredFinalizadas = this.finalizadas
            .filter((item) => {
                if (!tokens.length) return true;
                const haystack = this.normalizeText([
                    item.personaNombre,
                    item.documento,
                    item.codigoEntrevista,
                    item.clinica,
                    item.regional,
                    item.encuestador,
                    item.loteNombre
                ].filter(Boolean).join(' '));
                return tokens.every((token) => haystack.includes(token));
            })
            .sort((a, b) => {
                const fechaA = a.fechaFin ? new Date(a.fechaFin).getTime() : 0;
                const fechaB = b.fechaFin ? new Date(b.fechaFin).getTime() : 0;
                return fechaB - fechaA;
            });
    }

    private normalizeIdentityDocument(value: unknown): string {
        return String(value ?? '').replace(/\D/g, '');
    }

    private applyDirectRegistrationLookup(response: PersonaBusquedaCiResponse): void {
        this.directRegistrationForm.nombre = (response.nombres || '').trim();
        this.directRegistrationForm.apellido = [response.paterno, response.materno]
            .filter((item) => !!item && item.trim().length > 0)
            .join(' ')
            .trim();
        this.directRegistrationForm.documento = response.documento || this.directRegistrationForm.documento;
        this.directRegistrationForm.medicarePersonId = response.idAfiliado ? String(response.idAfiliado) : '';
        this.directRegistrationLockedFields = {
            nombre: this.directRegistrationForm.nombre.length > 0,
            apellido: this.directRegistrationForm.apellido.length > 0,
            documento: this.directRegistrationForm.documento.length > 0,
            medicarePersonId: this.directRegistrationForm.medicarePersonId.length > 0
        };
        this.directRegistrationLockedSnapshot = {
            nombre: this.directRegistrationForm.nombre,
            apellido: this.directRegistrationForm.apellido,
            documento: this.directRegistrationForm.documento,
            medicarePersonId: this.directRegistrationForm.medicarePersonId
        };
        this.directRegistrationStep = 'form';
        this.directRegistrationLookupNotice = null;
    }

    private createDirectRegistrationForm() {
        return {
            nombre: '',
            apellido: '',
            documento: '',
            medicarePersonId: '',
            clinica: '',
            regional: '',
            fechaConsulta: this.todayLocalIsoDate(),
            tipoConsulta: 'PRIMERA_CONSULTA_SSR'
        };
    }

    private createDirectRegistrationLockedFields(): DirectRegistrationLockedFields {
        return {
            nombre: false,
            apellido: false,
            documento: false,
            medicarePersonId: false
        };
    }

    private createDirectRegistrationLockedSnapshot(): DirectRegistrationLockedSnapshot {
        return {
            nombre: '',
            apellido: '',
            documento: '',
            medicarePersonId: ''
        };
    }

    private hasValidDirectRegistrationLockedValues(): boolean {
        return (!this.directRegistrationLockedFields.nombre || this.directRegistrationForm.nombre === this.directRegistrationLockedSnapshot.nombre)
            && (!this.directRegistrationLockedFields.apellido || this.directRegistrationForm.apellido === this.directRegistrationLockedSnapshot.apellido)
            && (!this.directRegistrationLockedFields.documento || this.directRegistrationForm.documento === this.directRegistrationLockedSnapshot.documento)
            && (!this.directRegistrationLockedFields.medicarePersonId || this.directRegistrationForm.medicarePersonId === this.directRegistrationLockedSnapshot.medicarePersonId);
    }

    private todayLocalIsoDate(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private normalizeText(value: unknown): string {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
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
