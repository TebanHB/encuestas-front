import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { EncuestaDetalleResponse, EncuestaResponse, EncuestaService, GuardarRespuestaRequest } from '../../service/encuesta.service';

interface RespuestaPreguntaUI {
    preguntaId: number;
    tipo: string;
    textoRespuesta: string;
    opcionUnicaId: number | null;
    opcionMultipleIds: number[];
}

interface UsuarioLogueado {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    puedeCrearEncuestas: boolean;
    activo: boolean;
}

@Component({
    selector: 'app-responder-encuestas',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CardModule, InputTextModule, TableModule, TagModule, TextareaModule, RadioButtonModule, CheckboxModule],
    template: `
        <div class="responder-wrapper">
            <div class="responder-container">
                <div class="col-12" *ngIf="!modoResponder">
                    <div class="card">
                        <div class="page-header">
                            <div>
                                <h2 class="page-title">Encuestas abiertas</h2>
                                <p class="page-subtitle">Aquí puedes ver y responder encuestas disponibles.</p>
                            </div>
                        </div>

                        <div *ngIf="loadingListado" class="mb-4">Cargando encuestas...</div>

                        <div *ngIf="errorMessage" class="mb-4 text-red-500 font-medium">
                            {{ errorMessage }}
                        </div>

                        <div *ngIf="successMessage" class="mb-4 text-green-600 font-medium">
                            {{ successMessage }}
                        </div>

                        <p-table [value]="encuestasAbiertas" [tableStyle]="{ 'min-width': '70rem' }" responsiveLayout="scroll">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Descripción</th>
                                    <th>Tipo</th>
                                    <th>Preguntas</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                    <th style="width: 180px">Acción</th>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-encuesta>
                                <tr>
                                    <td>{{ encuesta.id }}</td>
                                    <td>{{ encuesta.titulo }}</td>
                                    <td>{{ encuesta.descripcion || 'Sin descripción' }}</td>
                                    <td>
                                        <p-tag [value]="encuesta.modoCalificable ? 'Cuestionario' : 'Encuesta'" [severity]="encuesta.modoCalificable ? 'warn' : 'info'"></p-tag>
                                    </td>
                                    <td>{{ encuesta.cantidadPreguntas }}</td>
                                    <td>
                                        <p-tag value="Abierta" severity="success"></p-tag>
                                    </td>
                                    <td>{{ formatearFecha(encuesta.fechaCreacion) }}</td>
                                    <td>
                                        <button pButton type="button" label="Responder" icon="pi pi-file-edit" (click)="irAResponder(encuesta.id)"></button>
                                    </td>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="8" class="text-center py-4">No tienes encuestas abiertas pendientes por responder.</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>

                <div class="col-12" *ngIf="modoResponder">
                    <div class="survey-shell">
                        <section class="card survey-header">
                            <div class="survey-header__content">
                                <div class="survey-header__text">
                                    <div class="survey-badges">
                                        <p-tag value="Encuesta" severity="info"></p-tag>
                                        <p-tag [value]="encuestaDetalle?.modoCalificable ? 'Cuestionario' : 'Encuesta'" [severity]="encuestaDetalle?.modoCalificable ? 'warn' : 'contrast'"></p-tag>
                                        <p-tag value="Abierta" severity="success"></p-tag>
                                    </div>

                                    <h1 class="survey-title">{{ encuestaDetalle?.titulo || 'Responder encuesta' }}</h1>
                                    <p class="survey-description">
                                        {{ encuestaDetalle?.descripcion || 'Completa las respuestas y envía el formulario.' }}
                                    </p>
                                </div>

                                <div class="survey-header__actions">
                                    <button pButton type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" (click)="volverListado()"></button>
                                    <button pButton type="button" label="Enviar respuestas" icon="pi pi-send" [disabled]="enviando || cargandoDetalle" [loading]="enviando" (click)="enviarRespuestas()"></button>
                                </div>
                            </div>
                        </section>

                        <div *ngIf="cargandoDetalle" class="card">Cargando encuesta...</div>

                        <div *ngIf="!cargandoDetalle && encuestaDetalle" class="survey-layout">
                            <main class="survey-main">
                                <section class="card section-card participant-card">
                                    <div class="section-header">
                                        <h3>Respondiendo como</h3>
                                        <p>Esta encuesta se registrará con los datos del usuario que inició sesión.</p>
                                    </div>

                                    <div class="user-summary">
                                        <div class="user-summary__item">
                                            <span class="user-summary__label">Nombre</span>
                                            <strong>{{ nombreCompletoUsuario || 'Usuario no identificado' }}</strong>
                                        </div>

                                        <div class="user-summary__item">
                                            <span class="user-summary__label">Correo</span>
                                            <strong>{{ correoUsuario || 'Sin correo' }}</strong>
                                        </div>

                                        <div class="user-summary__item">
                                            <span class="user-summary__label">Rol</span>
                                            <strong>{{ usuarioLogueado?.rol || 'Sin rol' }}</strong>
                                        </div>
                                    </div>
                                </section>

                                <section *ngIf="errorMessage" class="card status-card status-card--error">
                                    {{ errorMessage }}
                                </section>

                                <section *ngIf="successMessage" class="card status-card status-card--success">
                                    {{ successMessage }}
                                </section>

                                <section class="card question-card" *ngFor="let pregunta of encuestaDetalle.preguntas; let i = index">
                                    <div class="question-card__header">
                                        <div class="question-card__tags">
                                            <p-tag [value]="'Pregunta ' + (i + 1)" severity="info"></p-tag>
                                            <p-tag [value]="getTipoTexto(pregunta.tipo)" severity="contrast"></p-tag>
                                            <p-tag *ngIf="pregunta.obligatoria" value="Obligatoria" severity="danger"></p-tag>
                                        </div>

                                        <h3 class="question-title">{{ getPreguntaTituloMostrado(i, pregunta) }}</h3>
                                    </div>

                                    <div *ngIf="pregunta.tipo === 'TEXTO' || pregunta.tipo === 'TEXTO_CORTO'">
                                        <input pInputText class="w-full" placeholder="Escribe tu respuesta" [(ngModel)]="respuestasMap[pregunta.id].textoRespuesta" />
                                    </div>

                                    <div *ngIf="pregunta.tipo === 'TEXTO_LARGO'">
                                        <textarea pTextarea rows="5" class="w-full" placeholder="Escribe tu respuesta" [(ngModel)]="respuestasMap[pregunta.id].textoRespuesta"></textarea>
                                    </div>

                                    <div *ngIf="pregunta.tipo === 'COMPLETAR_ORACION'">
                                        <input pInputText class="w-full" placeholder="Completa la oración" [(ngModel)]="respuestasMap[pregunta.id].textoRespuesta" />
                                    </div>

                                    <div *ngIf="pregunta.tipo === 'NUMERICA'">
                                        <input pInputText class="w-full" placeholder="Ingresa un número" [(ngModel)]="respuestasMap[pregunta.id].textoRespuesta" />
                                    </div>

                                    <div *ngIf="pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'SI_NO'" class="options-list">
                                        <label *ngFor="let opcion of pregunta.opciones; let j = index" class="option-item">
                                            <div class="option-control">
                                                <p-radiobutton [name]="'pregunta-' + pregunta.id" [value]="opcion.id" [(ngModel)]="respuestasMap[pregunta.id].opcionUnicaId"></p-radiobutton>
                                            </div>
                                            <span class="option-text">{{ getTextoOpcionMostrado(j, pregunta.formatoOpciones, opcion.texto) }}</span>
                                        </label>
                                    </div>

                                    <div *ngIf="pregunta.tipo === 'OPCION_MULTIPLE'" class="options-list">
                                        <label *ngFor="let opcion of pregunta.opciones; let j = index" class="option-item">
                                            <div class="option-control">
                                                <p-checkbox
                                                    [binary]="true"
                                                    [ngModel]="estaOpcionSeleccionada(pregunta.id, opcion.id)"
                                                    (ngModelChange)="toggleOpcionMultiple(pregunta.id, opcion.id, $event)"
                                                    [inputId]="'pregunta-' + pregunta.id + '-opcion-' + opcion.id"
                                                ></p-checkbox>
                                            </div>
                                            <span class="option-text">{{ getTextoOpcionMostrado(j, pregunta.formatoOpciones, opcion.texto) }}</span>
                                        </label>
                                    </div>
                                </section>
                            </main>

                            <aside class="survey-sidebar">
                                <section class="card summary-card">
                                    <h3 class="summary-title">Resumen</h3>

                                    <div class="summary-list">
                                        <div class="summary-item">
                                            <span class="summary-label">Usuario</span>
                                            <strong>{{ usuarioLogueado?.nombre || 'N/D' }}</strong>
                                        </div>

                                        <div class="summary-item">
                                            <span class="summary-label">Tipo</span>
                                            <strong>{{ encuestaDetalle.modoCalificable ? 'Cuestionario' : 'Encuesta' }}</strong>
                                        </div>

                                        <div class="summary-item">
                                            <span class="summary-label">Preguntas</span>
                                            <strong>{{ encuestaDetalle.preguntas.length }}</strong>
                                        </div>

                                        <div class="summary-item">
                                            <span class="summary-label">Estado</span>
                                            <strong>Abierta</strong>
                                        </div>
                                    </div>

                                    <button pButton type="button" label="Enviar respuestas" icon="pi pi-send" class="w-full mt-4" [disabled]="enviando || cargandoDetalle" [loading]="enviando" (click)="enviarRespuestas()"></button>
                                </section>
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .responder-wrapper {
                width: 100%;
            }

            .responder-container {
                width: 100%;
                max-width: 1280px;
                margin: 0 auto;
            }

            .page-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .page-title {
                margin: 0;
                font-size: 2rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .page-subtitle {
                margin: 0.6rem 0 0 0;
                color: var(--text-color-secondary);
            }

            .survey-shell {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .survey-header {
                padding: 1.5rem;
            }

            .survey-header__content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1.5rem;
            }

            .survey-header__text {
                min-width: 0;
                flex: 1;
            }

            .survey-badges {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 0.9rem;
            }

            .survey-title {
                margin: 0;
                font-size: 2.3rem;
                font-weight: 700;
                color: var(--text-color);
                line-height: 1.1;
            }

            .survey-description {
                margin: 0.85rem 0 0 0;
                color: var(--text-color-secondary);
                font-size: 1rem;
                line-height: 1.6;
                max-width: 56rem;
            }

            .survey-header__actions {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                justify-content: flex-end;
            }

            .survey-layout {
                display: grid;
                grid-template-columns: minmax(0, 2fr) 340px;
                gap: 1.5rem;
                align-items: start;
            }

            .survey-main {
                min-width: 0;
            }

            .survey-sidebar {
                min-width: 0;
            }

            .section-card,
            .question-card,
            .summary-card,
            .status-card {
                margin-bottom: 1rem;
            }

            .section-header h3,
            .summary-title {
                margin: 0;
                font-size: 1.4rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .section-header p {
                margin: 0.5rem 0 0 0;
                color: var(--text-color-secondary);
            }

            .user-summary {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }

            .user-summary__item {
                background: var(--surface-50);
                border: 1px solid var(--surface-border);
                border-radius: 0.9rem;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            .user-summary__label {
                color: var(--text-color-secondary);
                font-size: 0.9rem;
            }

            .status-card {
                font-weight: 600;
            }

            .status-card--error {
                color: #dc2626;
            }

            .status-card--success {
                color: #16a34a;
            }

            .question-card {
                padding: 1.25rem;
            }

            .question-card__header {
                margin-bottom: 1rem;
            }

            .question-card__tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 0.85rem;
            }

            .question-title {
                margin: 0;
                font-size: 1.6rem;
                line-height: 1.3;
                font-weight: 700;
                color: var(--text-color);
            }

            .options-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .option-item {
                display: flex;
                align-items: center;
                gap: 0.85rem;
                padding: 0.9rem 1rem;
                border: 1px solid var(--surface-border);
                border-radius: 0.9rem;
                background: var(--surface-50);
                cursor: pointer;
                transition:
                    border-color 0.2s ease,
                    transform 0.2s ease;
            }

            .option-item:hover {
                border-color: var(--primary-color);
                transform: translateY(-1px);
            }

            .option-control {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .option-text {
                color: var(--text-color);
                line-height: 1.45;
            }

            .summary-card {
                position: sticky;
                top: 1.5rem;
            }

            .summary-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-top: 1rem;
            }

            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid var(--surface-border);
            }

            .summary-item:last-child {
                border-bottom: none;
                padding-bottom: 0;
            }

            .summary-label {
                color: var(--text-color-secondary);
            }

            @media (max-width: 1100px) {
                .survey-layout {
                    grid-template-columns: 1fr;
                }

                .summary-card {
                    position: static;
                }

                .user-summary {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 768px) {
                .survey-header__content {
                    flex-direction: column;
                    align-items: stretch;
                }

                .survey-header__actions {
                    justify-content: stretch;
                    flex-direction: column;
                }

                .survey-title {
                    font-size: 1.9rem;
                }

                .question-title {
                    font-size: 1.35rem;
                }
            }
        `
    ]
})
export class ResponderEncuestas implements OnInit {
    private encuestaService = inject(EncuestaService);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    modoResponder = false;
    encuestaId: number | null = null;

    loadingListado = false;
    cargandoDetalle = false;
    enviando = false;

    errorMessage = '';
    successMessage = '';

    encuestasAbiertas: EncuestaResponse[] = [];
    encuestaDetalle: EncuestaDetalleResponse | null = null;

    usuarioLogueado: UsuarioLogueado | null = null;

    respuestasMap: Record<number, RespuestaPreguntaUI> = {};

    ngOnInit(): void {
        this.cargarUsuarioLogueado();

        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.modoResponder = true;
            this.encuestaId = Number(id);
            this.cargarDetalleEncuesta(this.encuestaId);
        } else {
            this.cargarEncuestasAbiertas();
        }
    }

    cargarUsuarioLogueado(): void {
        const rawUser = localStorage.getItem('auth_user');

        if (!rawUser) {
            this.usuarioLogueado = null;
            return;
        }

        try {
            this.usuarioLogueado = JSON.parse(rawUser) as UsuarioLogueado;
        } catch (error) {
            console.error('No se pudo leer auth_user desde localStorage:', error);
            this.usuarioLogueado = null;
        }
    }

    get nombreCompletoUsuario(): string {
        if (!this.usuarioLogueado) {
            return '';
        }

        return `${this.usuarioLogueado.nombre || ''} ${this.usuarioLogueado.apellido || ''}`.trim();
    }

    get correoUsuario(): string {
        return this.usuarioLogueado?.email || '';
    }

    cargarEncuestasAbiertas(): void {
        this.loadingListado = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        if (!this.correoUsuario) {
            this.errorMessage = 'No se pudo obtener el correo del usuario logueado.';
            this.loadingListado = false;
            this.cdr.detectChanges();
            return;
        }

        this.encuestaService.listarEncuestasDisponiblesParaEmpleado(this.correoUsuario).subscribe({
            next: (data) => {
                this.encuestasAbiertas = data;
                this.loadingListado = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al listar encuestas abiertas disponibles:', error);
                this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudieron cargar las encuestas disponibles.';
                this.loadingListado = false;
                this.cdr.detectChanges();
            }
        });
    }

    cargarDetalleEncuesta(id: number): void {
        this.cargandoDetalle = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.cdr.detectChanges();

        this.encuestaService.obtenerDetalleEncuesta(id).subscribe({
            next: (data) => {
                if (data.estado !== 'OPEN') {
                    this.errorMessage = 'Solo las encuestas abiertas pueden responderse.';
                    this.encuestaDetalle = null;
                    this.cargandoDetalle = false;
                    this.cdr.detectChanges();
                    return;
                }

                this.encuestaDetalle = data;
                this.inicializarRespuestas(data);
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

    inicializarRespuestas(encuesta: EncuestaDetalleResponse): void {
        this.respuestasMap = {};

        encuesta.preguntas.forEach((pregunta) => {
            this.respuestasMap[pregunta.id] = {
                preguntaId: pregunta.id,
                tipo: pregunta.tipo,
                textoRespuesta: '',
                opcionUnicaId: null,
                opcionMultipleIds: []
            };
        });
    }

    irAResponder(id: number): void {
        this.router.navigate(['/pages/encuestas/responder', id]);
    }

    volverListado(): void {
        this.router.navigate(['/pages/encuestas/responder']);
    }

    estaOpcionSeleccionada(preguntaId: number, opcionId: number): boolean {
        return this.respuestasMap[preguntaId]?.opcionMultipleIds.includes(opcionId) ?? false;
    }

    toggleOpcionMultiple(preguntaId: number, opcionId: number, checked: boolean): void {
        const respuesta = this.respuestasMap[preguntaId];
        if (!respuesta) {
            return;
        }

        if (checked) {
            if (!respuesta.opcionMultipleIds.includes(opcionId)) {
                respuesta.opcionMultipleIds.push(opcionId);
            }
        } else {
            respuesta.opcionMultipleIds = respuesta.opcionMultipleIds.filter((id) => id !== opcionId);
        }

        this.cdr.detectChanges();
    }

    enviarRespuestas(): void {
        if (!this.encuestaDetalle || !this.encuestaId || this.enviando) {
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';

        if (!this.usuarioLogueado) {
            this.errorMessage = 'No se encontró el usuario logueado. Vuelve a iniciar sesión.';
            this.cdr.detectChanges();
            return;
        }

        if (!this.usuarioLogueado.id) {
            this.errorMessage = 'No se pudo obtener el identificador del usuario logueado.';
            this.cdr.detectChanges();
            return;
        }

        const respuestasPayload: GuardarRespuestaRequest['respuestas'] = [];

        for (const pregunta of this.encuestaDetalle.preguntas) {
            const respuesta = this.respuestasMap[pregunta.id];

            if (!respuesta) {
                continue;
            }

            if (this.esPreguntaTexto(pregunta.tipo)) {
                if (pregunta.obligatoria && !respuesta.textoRespuesta.trim()) {
                    this.errorMessage = `La pregunta "${pregunta.titulo}" es obligatoria.`;
                    this.cdr.detectChanges();
                    return;
                }

                if (pregunta.tipo === 'NUMERICA' && respuesta.textoRespuesta.trim() && isNaN(Number(respuesta.textoRespuesta.trim()))) {
                    this.errorMessage = `La pregunta "${pregunta.titulo}" debe tener un valor numérico.`;
                    this.cdr.detectChanges();
                    return;
                }

                respuestasPayload.push({
                    preguntaId: pregunta.id,
                    textoRespuesta: respuesta.textoRespuesta.trim()
                });
                continue;
            }

            if (pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'SI_NO') {
                if (pregunta.obligatoria && !respuesta.opcionUnicaId) {
                    this.errorMessage = `Debes seleccionar una opción para la pregunta ${pregunta.titulo}.`;
                    this.cdr.detectChanges();
                    return;
                }

                respuestasPayload.push({
                    preguntaId: pregunta.id,
                    opcionIds: respuesta.opcionUnicaId ? [respuesta.opcionUnicaId] : []
                });
                continue;
            }

            if (pregunta.tipo === 'OPCION_MULTIPLE') {
                if (pregunta.obligatoria && respuesta.opcionMultipleIds.length === 0) {
                    this.errorMessage = `Debes seleccionar al menos una opción para la pregunta ${pregunta.titulo}.`;
                    this.cdr.detectChanges();
                    return;
                }

                respuestasPayload.push({
                    preguntaId: pregunta.id,
                    opcionIds: [...respuesta.opcionMultipleIds]
                });
            }
        }

        this.enviando = true;
        this.cdr.detectChanges();

        this.encuestaService
            .guardarRespuesta({
                usuarioId: this.usuarioLogueado.id,
                encuestaId: this.encuestaId,
                respuestas: respuestasPayload
            })
            .subscribe({
                next: () => {
                    this.successMessage = 'Respuestas enviadas correctamente.';
                    this.errorMessage = '';
                    this.enviando = false;
                    this.cdr.detectChanges();

                    setTimeout(() => {
                        this.volverListado();
                    }, 1200);
                },
                error: (error) => {
                    console.error('Error al enviar respuestas:', error);
                    this.errorMessage = typeof error?.error === 'string' ? error.error : 'No se pudieron enviar las respuestas.';
                    this.enviando = false;
                    this.cdr.detectChanges();
                }
            });
    }

    esPreguntaTexto(tipo: string): boolean {
        return tipo === 'TEXTO' || tipo === 'TEXTO_CORTO' || tipo === 'TEXTO_LARGO' || tipo === 'COMPLETAR_ORACION' || tipo === 'NUMERICA';
    }

    getTipoTexto(tipo: string): string {
        switch (tipo) {
            case 'TEXTO':
                return 'Texto';
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

    getPreguntaTituloMostrado(index: number, pregunta: any): string {
        const prefijo = this.getPrefijo(index, pregunta?.formatoNumeracion ?? 'NINGUNA');
        return `${prefijo}${pregunta?.titulo || ''}`;
    }

    getTextoOpcionMostrado(index: number, formatoOpciones: string | undefined, texto: string): string {
        const prefijo = this.getPrefijo(index, formatoOpciones ?? 'SIN_PREFIJO');
        return `${prefijo}${texto || ''}`;
    }

    getPrefijo(index: number, formato: string): string {
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

    numeroALetra(index: number): string {
        let numero = index;
        let resultado = '';

        do {
            resultado = String.fromCharCode(97 + (numero % 26)) + resultado;
            numero = Math.floor(numero / 26) - 1;
        } while (numero >= 0);

        return resultado;
    }

    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleString();
    }
}
