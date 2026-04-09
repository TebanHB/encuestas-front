import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, Entrevista, PersonaElegible, PreguntaInstrumento, RespuestaPayload } from '../../services/cies.service';
import { OfflineInterviewQueueService } from '../../services/offline-interview-queue.service';

@Component({
    selector: 'app-entrevistas-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule, CiesInfoHintComponent],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--amber">Trabajo de campo</div>
                    <h1 class="cies-hero__title">Aplicar entrevistas</h1>
                    <p class="cies-hero__copy">Si la persona ya está lista, abre su entrevista. Si es una persona nueva, regístrala aquí mismo y empieza al instante.</p>
                </div>
                <div class="cies-hero__actions">
                    <button pButton type="button" label="Entrevistar a una persona" icon="pi pi-user-plus" severity="secondary" [outlined]="true" (click)="openDirectRegistration()"></button>
                    <p-tag [value]="'Cola offline: ' + offlineQueue.count()" severity="contrast"></p-tag>
                </div>
            </section>

            <section *ngIf="!currentInterview" class="cies-guidance-grid">
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">1</div>
                    <div class="cies-stack">
                        <h4>Si es una persona nueva</h4>
                        <p>Usa el botón <strong>Entrevistar a una persona</strong>. El sistema la registra y abre la entrevista automáticamente.</p>
                    </div>
                    <div class="cies-guidance-actions">
                        <button pButton type="button" label="Registrar ahora" (click)="openDirectRegistration()"></button>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">2</div>
                    <div class="cies-stack">
                        <h4>Si ya aparece en la lista</h4>
                        <p>Solo pulsa <strong>Iniciar</strong>. No vuelvas a registrar a la persona si ya la ves abajo.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">3</div>
                    <div class="cies-stack">
                        <h4>Cuando termines</h4>
                        <p>Finaliza la entrevista. Si no hay internet, guárdala offline y el sistema la enviará después.</p>
                    </div>
                </article>
            </section>

            <section class="card" *ngIf="!currentInterview">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Personas listas para entrevistar</h3>
                            <p>Abre la entrevista de una persona ya preparada para atención.</p>
                        </div>
                        <app-cies-info-hint text="Solo se muestran casos pendientes o entrevistas en curso vinculadas al encuestador actual."></app-cies-info-hint>
                    </div>
                    <p-tag *ngIf="pendientes.length" [value]="filteredPendientes.length + ' visibles'" severity="info"></p-tag>
                </div>

                <div *ngIf="!pendientes.length" class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-face-smile"></i>
                    </div>
                    <h3>No hay personas pendientes en este momento</h3>
                    <p>Si acaba de llegar una persona y debes entrevistarla ahora, usa el registro directo. No necesitas crear un lote ni subir un archivo.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Entrevistar a una persona" icon="pi pi-user-plus" (click)="openDirectRegistration()"></button>
                    </div>
                </div>

                <div *ngIf="pendientes.length" class="cies-form-grid cies-form-grid--three">
                    <div class="cies-field--wide">
                        <label>Buscar persona</label>
                        <input pInputText [(ngModel)]="searchTerm" class="w-full" placeholder="Busca por nombre, documento, código o clínica" />
                    </div>
                    <div>
                        <label>Filtrar por clínica</label>
                        <p-select [options]="clinicaOptions" [(ngModel)]="selectedClinica" optionLabel="label" optionValue="value" appendTo="body" class="w-full"></p-select>
                    </div>
                    <div>
                        <label>Filtrar por listado</label>
                        <p-select [options]="loteOptions" [(ngModel)]="selectedLote" optionLabel="label" optionValue="value" appendTo="body" class="w-full"></p-select>
                    </div>
                </div>

                <div *ngIf="pendientes.length && !filteredPendientes.length" class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-search"></i>
                    </div>
                    <h3>No hay coincidencias con ese filtro</h3>
                    <p>Prueba quitando el nombre, la clínica o el listado para volver a ver todas las personas pendientes.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Quitar filtros" severity="secondary" [outlined]="true" icon="pi pi-times" (click)="clearFilters()"></button>
                    </div>
                </div>

                <p-table *ngIf="filteredPendientes.length" [value]="filteredPendientes" [tableStyle]="{ 'min-width': '76rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Persona</th>
                            <th>Listado</th>
                            <th>Documento</th>
                            <th>Clínica</th>
                            <th>Regional</th>
                            <th>Fecha</th>
                            <th>Acción</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>{{ item.nombreCompleto }}</td>
                            <td>
                                <div class="cies-stack" style="gap: 0.35rem">
                                    <strong>{{ item.loteNombre || 'Sin listado' }}</strong>
                                    <p-tag [value]="isDirectRegistration(item) ? 'Registro directo' : 'Carga por listado'" [severity]="isDirectRegistration(item) ? 'success' : 'info'"></p-tag>
                                </div>
                            </td>
                            <td>{{ item.documento || 'Sin dato' }}</td>
                            <td>{{ item.clinica }}</td>
                            <td>{{ item.regional }}</td>
                            <td>{{ item.fechaConsulta }}</td>
                            <td><button pButton type="button" label="Iniciar" icon="pi pi-play" (click)="start(item)"></button></td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section *ngIf="currentInterview" class="card cies-stack">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Entrevista {{ currentInterview.codigo }}</h3>
                            <p>{{ currentInterview.personaNombre }} - {{ currentInterview.clinica }} - {{ currentInterview.regional }}</p>
                        </div>
                        <app-cies-info-hint text="Completa todas las respuestas obligatorias antes de finalizar. Si no hay conexión, puedes guardar la entrevista offline."></app-cies-info-hint>
                    </div>
                    <button pButton type="button" label="Cerrar" severity="secondary" [outlined]="true" (click)="closeInterview()"></button>
                </div>

                <div class="cies-soft-note">
                    Responde las preguntas de arriba hacia abajo. Si un campo es obligatorio y falta, el sistema te lo mostrará antes de cerrar la entrevista.
                </div>

                <div class="cies-note cies-note--warning" *ngIf="terminatesInterview">
                    La consulta fue registrada para otra persona. Según la regla del instrumento, la entrevista termina en esta pregunta.
                </div>

                <div class="cies-note cies-note--error" *ngIf="showValidation && validationErrors.length">
                    <strong>Faltan respuestas obligatorias:</strong>
                    <span>{{ validationErrors.join(' | ') }}</span>
                </div>

                <div class="cies-question-grid">
                    <div *ngFor="let question of visibleQuestions" class="cies-question-card" [class.invalid]="showValidation && isQuestionInvalid(question)">
                        <label>{{ question.numeroVisible }}. {{ question.etiqueta }}</label>

                        <p-select
                            *ngIf="isOptionQuestion(question)"
                            [options]="question.opciones"
                            [(ngModel)]="answers[question.id].codigoOpcion"
                            optionLabel="etiqueta"
                            optionValue="codigo"
                            appendTo="body"
                            class="w-full"
                        ></p-select>

                        <input *ngIf="question.tipo === 'TEXTO'" pInputText [(ngModel)]="answers[question.id].valorTexto" class="w-full" />
                        <input *ngIf="question.tipo === 'FECHA_HORA'" pInputText [(ngModel)]="answers[question.id].valorTexto" class="w-full" type="datetime-local" />
                        <textarea *ngIf="question.tipo === 'TEXTO_LARGO'" pTextarea [(ngModel)]="answers[question.id].valorTexto" rows="3" class="w-full"></textarea>

                        <small class="cies-helper" *ngIf="question.logicaCondicional">{{ question.logicaCondicional }}</small>
                        <small class="cies-error-text" *ngIf="showValidation && isQuestionInvalid(question)">Esta respuesta es obligatoria.</small>
                    </div>
                </div>

                <div class="cies-actions-row">
                    <button pButton type="button" label="Guardar offline" severity="secondary" [outlined]="true" icon="pi pi-download" (click)="saveOffline()"></button>
                    <button pButton type="button" [label]="terminatesInterview ? 'Cerrar entrevista' : 'Finalizar entrevista'" icon="pi pi-check" (click)="submit()"></button>
                </div>
            </section>

            <p-dialog [(visible)]="directRegistrationVisible" [modal]="true" [draggable]="false" [style]="{ width: 'min(42rem, 96vw)' }" header="Registrar persona y empezar entrevista" styleClass="cies-dialog">
                <div class="cies-stack">
                    <p class="cies-muted">
                        Usa este formulario cuando solo necesitas entrevistar a una persona. El sistema crea un registro individual, la deja lista y abre la entrevista enseguida.
                    </p>

                    <div class="cies-form-grid cies-form-grid--two cies-dialog-form">
                        <div>
                            <label>Nombre</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.nombre" class="w-full" />
                        </div>
                        <div>
                            <label>Apellido</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.apellido" class="w-full" />
                        </div>
                        <div>
                            <label>Documento</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.documento" class="w-full" />
                        </div>
                        <div>
                            <label>ID Medicare</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.medicarePersonId" class="w-full" placeholder="Opcional" />
                        </div>
                        <div>
                            <label>Clínica</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.clinica" class="w-full" />
                        </div>
                        <div>
                            <label>Regional</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.regional" class="w-full" />
                        </div>
                        <div>
                            <label>Fecha de consulta</label>
                            <input pInputText [(ngModel)]="directRegistrationForm.fechaConsulta" class="w-full" type="date" />
                        </div>
                        <div>
                            <label>Tipo de consulta</label>
                            <p-select
                                [options]="tipoConsultaOptions"
                                [(ngModel)]="directRegistrationForm.tipoConsulta"
                                optionLabel="label"
                                optionValue="value"
                                appendTo="body"
                                class="w-full"
                            ></p-select>
                        </div>
                    </div>

                    <div class="cies-note cies-note--error" *ngIf="directRegistrationError">
                        {{ directRegistrationError }}
                    </div>
                </div>

                <ng-template pTemplate="footer">
                    <div class="cies-actions-row">
                        <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="closeDirectRegistration()"></button>
                        <button pButton type="button" label="Crear y abrir entrevista" icon="pi pi-arrow-right" [loading]="directRegistrationLoading" (click)="registerDirectInterview()"></button>
                    </div>
                </ng-template>
            </p-dialog>
        </div>
    `,
    styles: [``]
})
export class EntrevistasPage implements OnInit, OnDestroy {
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    readonly offlineQueue = inject(OfflineInterviewQueueService);

    pendientes: PersonaElegible[] = [];
    currentInterview: Entrevista | null = null;
    answers: Record<number, { codigoOpcion?: string; valorTexto?: string }> = {};
    showValidation = false;
    directRegistrationVisible = false;
    directRegistrationLoading = false;
    directRegistrationError = '';
    searchTerm = '';
    selectedClinica = '';
    selectedLote = '';

    readonly tipoConsultaOptions = [
        { label: 'Primera consulta SSR', value: 'PRIMERA_CONSULTA_SSR' },
        { label: 'Consulta general', value: 'CONSULTA_GENERAL' },
        { label: 'Control', value: 'CONTROL' }
    ];

    directRegistrationForm = this.createDirectRegistrationForm();

    private onlineHandler = () => {
        void this.offlineQueue.flush();
    };

    get visibleQuestions(): PreguntaInstrumento[] {
        const questions = (this.currentInterview?.preguntas || []).filter((item) => !item.metadato);
        if (!this.terminatesInterview) {
            return questions;
        }

        const pivot = questions.find((item) => item.codigoVariable === 'CONSULTA_PARA');
        return pivot ? questions.filter((item) => item.orden <= pivot.orden) : questions;
    }

    get terminatesInterview(): boolean {
        const question = this.currentInterview?.preguntas.find((item) => item.codigoVariable === 'CONSULTA_PARA');
        return !!question && this.answers[question.id]?.codigoOpcion === '2';
    }

    get validationErrors(): string[] {
        return this.visibleQuestions.filter((question) => this.isQuestionInvalid(question)).map((question) => question.codigoVariable);
    }

    get clinicaOptions(): Array<{ label: string; value: string }> {
        const values = Array.from(new Set(this.pendientes.map((item) => item.clinica).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        return [{ label: 'Todas', value: '' }, ...values.map((value) => ({ label: value, value }))];
    }

    get loteOptions(): Array<{ label: string; value: string }> {
        const values = Array.from(new Set(this.pendientes.map((item) => item.loteNombre || 'Sin listado').filter(Boolean))).sort((a, b) => a.localeCompare(b));
        return [{ label: 'Todos', value: '' }, ...values.map((value) => ({ label: value, value }))];
    }

    get filteredPendientes(): PersonaElegible[] {
        const search = this.normalizeText(this.searchTerm);

        return this.pendientes
            .filter((item) => !this.selectedClinica || item.clinica === this.selectedClinica)
            .filter((item) => !this.selectedLote || (item.loteNombre || 'Sin listado') === this.selectedLote)
            .filter((item) => {
                if (!search) {
                    return true;
                }

                const haystack = this.normalizeText(
                    [item.nombreCompleto, item.documento, item.codigoEntrevista, item.clinica, item.regional, item.loteNombre, item.medicarePersonId].filter(Boolean).join(' ')
                );
                return haystack.includes(search);
            })
            .sort((a, b) => {
                const loteCompare = (a.loteNombre || '').localeCompare(b.loteNombre || '');
                if (loteCompare !== 0) {
                    return loteCompare;
                }
                return (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '');
            });
    }

    ngOnInit(): void {
        this.loadPendientes();
        void this.offlineQueue.flush();
        window.addEventListener('online', this.onlineHandler);
    }

    ngOnDestroy(): void {
        window.removeEventListener('online', this.onlineHandler);
    }

    loadPendientes(): void {
        this.ciesService.getPendientesEntrevista().subscribe({
            next: (response) => {
                this.pendientes = response;
                this.cdr.detectChanges();
            }
        });
    }

    start(item: PersonaElegible): void {
        this.ciesService.iniciarEntrevista(item.id).subscribe({
            next: (response) => {
                this.currentInterview = response;
                this.showValidation = false;
                this.answers = {};

                response.preguntas
                    .filter((question) => !question.metadato)
                    .forEach((question) => {
                        const saved = response.respuestas.find((answer) => answer.preguntaId === question.id);
                        this.answers[question.id] = {
                            codigoOpcion: saved?.valorCrudo || '',
                            valorTexto: saved?.valorCrudo || ''
                        };
                    });

                this.cdr.detectChanges();
            }
        });
    }

    closeInterview(): void {
        this.currentInterview = null;
        this.showValidation = false;
        this.answers = {};
        this.cdr.detectChanges();
    }

    isOptionQuestion(question: PreguntaInstrumento): boolean {
        return question.tipo === 'OPCION_UNICA' || question.tipo === 'BOOLEANO';
    }

    isQuestionInvalid(question: PreguntaInstrumento): boolean {
        if (!question.obligatoria) {
            return false;
        }

        const answer = this.answers[question.id];
        if (!answer) {
            return true;
        }

        if (this.isOptionQuestion(question)) {
            return !answer.codigoOpcion;
        }

        return !answer.valorTexto?.trim();
    }

    buildPayload(): RespuestaPayload[] {
        return this.visibleQuestions.map((question) => ({
            preguntaId: question.id,
            codigoOpcion: this.answers[question.id]?.codigoOpcion,
            valorTexto: this.answers[question.id]?.valorTexto
        }));
    }

    submit(): void {
        if (!this.currentInterview) {
            return;
        }

        this.showValidation = true;
        if (this.validationErrors.length) {
            this.cdr.detectChanges();
            return;
        }

        if (!navigator.onLine) {
            this.saveOffline();
            return;
        }

        this.ciesService.finalizarEntrevista(this.currentInterview.id, this.buildPayload()).subscribe({
            next: () => {
                this.closeInterview();
                this.loadPendientes();
            }
        });
    }

    saveOffline(): void {
        if (!this.currentInterview) {
            return;
        }

        this.showValidation = true;
        if (this.validationErrors.length) {
            this.cdr.detectChanges();
            return;
        }

        this.offlineQueue.enqueue(this.currentInterview.id, this.buildPayload());
        this.closeInterview();
    }

    openDirectRegistration(): void {
        this.directRegistrationVisible = true;
        this.directRegistrationError = '';
        this.cdr.detectChanges();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedClinica = '';
        this.selectedLote = '';
        this.cdr.detectChanges();
    }

    closeDirectRegistration(): void {
        this.directRegistrationVisible = false;
        this.directRegistrationLoading = false;
        this.directRegistrationError = '';
        this.directRegistrationForm = this.createDirectRegistrationForm();
        this.cdr.detectChanges();
    }

    registerDirectInterview(): void {
        this.directRegistrationError = '';

        const nombre = this.directRegistrationForm.nombre.trim();
        const apellido = this.directRegistrationForm.apellido.trim();
        const clinica = this.directRegistrationForm.clinica.trim();
        const regional = this.directRegistrationForm.regional.trim();

        if (!nombre || !apellido || !clinica || !regional || !this.directRegistrationForm.fechaConsulta) {
            this.directRegistrationError = 'Completa nombre, apellido, clínica, regional y fecha de consulta.';
            this.cdr.detectChanges();
            return;
        }

        this.directRegistrationLoading = true;

        const personaPayload = {
            medicarePersonId: this.directRegistrationForm.medicarePersonId.trim() || `DIRECTO-${Date.now()}`,
            nombre,
            apellido,
            ci: this.directRegistrationForm.documento.trim(),
            documento: this.directRegistrationForm.documento.trim(),
            clinica,
            regional,
            fechaConsulta: this.directRegistrationForm.fechaConsulta,
            tipoConsulta: this.directRegistrationForm.tipoConsulta
        };

        const loteNombre = `Registro directo - ${nombre} ${apellido}`.trim();

        this.ciesService.createLote(loteNombre, [personaPayload]).subscribe({
            next: (lote) => {
                this.ciesService.executeSeleccion(lote.id, `DIRECTO-${Date.now()}`).subscribe({
                    next: (ejecucion) => {
                        const persona = ejecucion.seleccionadas[0];
                        this.directRegistrationLoading = false;
                        this.closeDirectRegistration();
                        this.loadPendientes();

                        if (persona) {
                            this.start(persona);
                        } else {
                            this.cdr.detectChanges();
                        }
                    },
                    error: () => {
                        this.directRegistrationLoading = false;
                        this.directRegistrationError = 'Se creó el registro, pero falló la selección automática.';
                        this.cdr.detectChanges();
                    }
                });
            },
            error: () => {
                this.directRegistrationLoading = false;
                this.directRegistrationError = 'No se pudo crear el registro individual.';
                this.cdr.detectChanges();
            }
        });
    }

    private createDirectRegistrationForm() {
        return {
            nombre: '',
            apellido: '',
            documento: '',
            medicarePersonId: '',
            clinica: '',
            regional: '',
            fechaConsulta: new Date().toISOString().slice(0, 10),
            tipoConsulta: 'PRIMERA_CONSULTA_SSR'
        };
    }

    isDirectRegistration(item: PersonaElegible): boolean {
        return (item.loteNombre || '').toLowerCase().startsWith('registro directo');
    }

    private normalizeText(value: string | undefined | null): string {
        return (value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
}
