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
import { Toast } from 'primeng/toast';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, Metodologia, MetodologiaComparativo } from '../../services/cies.service';

@Component({
    selector: 'app-metodologia-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, TableModule, TagModule, TextareaModule, Toast, CiesInfoHintComponent],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--emerald">Metodología</div>
                    <h1 class="cies-hero__title">Reglas de clasificación del sistema</h1>
                    <p class="cies-hero__copy">Entra aquí solo si necesitas cambiar cómo clasifica el sistema. Si solo vas a entrevistar o ver resultados, no hace falta tocar esta pantalla.</p>
                </div>
                <div class="cies-hero__actions">
                    <button pButton type="button" label="Crear nueva versión" icon="pi pi-copy" (click)="openClone()"></button>
                </div>
            </section>

            <section class="cies-guidance-grid">
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">1</div>
                    <div class="cies-stack">
                        <h4>Empieza clonando</h4>
                        <p>No edites la versión activa directamente. Crea una copia y trabaja sobre esa versión nueva.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">2</div>
                    <div class="cies-stack">
                        <h4>Cambia solo lo necesario</h4>
                        <p>Ajusta umbrales, valores y ponderaciones únicamente si tienes una decisión metodológica aprobada.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">3</div>
                    <div class="cies-stack">
                        <h4>Activa cuando estés seguro</h4>
                        <p>La versión activa será la que use el sistema para nuevas entrevistas y reportes.</p>
                    </div>
                </article>
            </section>

            <section class="card cies-soft-note">
                <strong>Importante:</strong> esta pantalla es para cambios de metodología, no para trabajo diario de entrevistas.
            </section>

            <section class="cies-summary-grid" *ngIf="compareSummary">
                <article class="card cies-summary-card">
                    <div class="cies-card-caption">
                        <span>Preguntas</span>
                        <app-cies-info-hint text="Cantidad total de preguntas disponibles en la versión metodológica activa."></app-cies-info-hint>
                    </div>
                    <strong>{{ compareSummary.cantidadPreguntas }}</strong>
                </article>
                <article class="card cies-summary-card">
                    <div class="cies-card-caption">
                        <span>Opciones codificadas</span>
                        <app-cies-info-hint text="Total de categorías con código y valor numérico dentro del instrumento."></app-cies-info-hint>
                    </div>
                    <strong>{{ compareSummary.cantidadOpciones }}</strong>
                </article>
                <article class="card cies-summary-card">
                    <div class="cies-card-caption">
                        <span>Preguntas ponderadas</span>
                        <app-cies-info-hint text="Preguntas que participan en el cálculo del puntaje según la ponderación configurada."></app-cies-info-hint>
                    </div>
                    <strong>{{ compareSummary.preguntasConPonderacion }}</strong>
                </article>
                <article class="card cies-summary-card">
                    <div class="cies-card-caption">
                        <span>Umbrales activos</span>
                        <app-cies-info-hint text="Valores usados por el motor para clasificar pobreza, exclusión y subatención."></app-cies-info-hint>
                    </div>
                    <strong>{{ compareSummary.umbralPobre }}/{{ compareSummary.umbralExcluido }}/{{ compareSummary.umbralSubatendido }}</strong>
                </article>
            </section>

            <section class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Versiones guardadas</h3>
                            <p>Compara umbrales y decide qué versión quedará activa para operación y reportería.</p>
                        </div>
                        <app-cies-info-hint text="Activa una sola versión a la vez. Esa versión será la base para nuevas entrevistas y reportes."></app-cies-info-hint>
                    </div>
                </div>
                <p-table [value]="metodologias" [tableStyle]="{ 'min-width': '64rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Nombre</th>
                            <th>Umbral pobre</th>
                            <th>Umbral excluido</th>
                            <th>Umbral subatendido</th>
                            <th>Comentario</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>{{ item.nombre }}</td>
                            <td>{{ item.umbralPobre }}</td>
                            <td>{{ item.umbralExcluido }}</td>
                            <td>{{ item.umbralSubatendido }}</td>
                            <td>{{ item.comentarioCambio || 'Sin comentario' }}</td>
                            <td><p-tag [value]="item.activa ? 'Activa' : 'Borrador'" [severity]="item.activa ? 'success' : 'secondary'"></p-tag></td>
                            <td>
                                <div class="cies-inline-actions">
                                    <button pButton type="button" icon="pi pi-pencil" text rounded severity="info" (click)="openEdit(item)"></button>
                                    <button pButton type="button" icon="pi pi-check-circle" text rounded severity="success" [disabled]="item.activa" (click)="activate(item)"></button>
                                    <button pButton type="button" icon="pi pi-trash" text rounded severity="danger" [disabled]="item.activa" (click)="remove(item)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section *ngIf="active" class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Versión activa</h3>
                            <p>{{ active.nombre }} - {{ active.descripcion }}</p>
                        </div>
                        <app-cies-info-hint text="Este bloque resume el instrumento que hoy usa la aplicación para clasificar entrevistas."></app-cies-info-hint>
                    </div>
                    <p-tag value="Activa" severity="success"></p-tag>
                </div>

                <p-table [value]="active.preguntas" [tableStyle]="{ 'min-width': '64rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>#</th>
                            <th>Código</th>
                            <th>Pregunta</th>
                            <th>Tipo</th>
                            <th>Importancia</th>
                            <th>Puntos por respuesta</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-question>
                        <tr>
                            <td>{{ question.numeroVisible }}</td>
                            <td>{{ question.codigoVariable }}</td>
                            <td>{{ question.etiqueta }}</td>
                            <td>{{ question.tipo }}</td>
                            <td>{{ question.ponderacion }}</td>
                            <td>{{ summarizeOptions(question.opciones) }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>

        <p-toast></p-toast>

        <p-dialog
            [(visible)]="showEditor"
            [modal]="true"
            [style]="{ width: '76rem', 'max-width': '98vw' }"
            [draggable]="false"
            [resizable]="false"
            [header]="editor?.id ? 'Editar metodología' : 'Nueva metodología'"
            styleClass="cies-dialog"
        >
            <div *ngIf="editor" class="cies-soft-note">
                Flujo recomendado: revisa primero los umbrales, luego la importancia de las preguntas y al final guarda la nueva versión.
            </div>

            <div *ngIf="editor" class="cies-soft-note">
                <strong>Qué significa cada campo:</strong> la <strong>importancia de la pregunta</strong> indica cuánto pesa esa pregunta en el resultado final.
                Los <strong>puntos por respuesta</strong> indican cuántos puntos aporta cada opción cuando la persona la selecciona.
            </div>

            <div *ngIf="editor" class="cies-form-grid cies-form-grid--three cies-dialog-form">
                <div class="cies-field--full">
                    <label>Nombre</label>
                    <input pInputText [(ngModel)]="editor.nombre" class="w-full" />
                </div>
                <div class="cies-field--full">
                    <label>Descripción</label>
                    <textarea pTextarea [(ngModel)]="editor.descripcion" rows="3" class="w-full"></textarea>
                </div>
                <div>
                    <label>Umbral pobre</label>
                    <p-inputnumber [(ngModel)]="editor.umbralPobre" [min]="0" [max]="100" class="w-full"></p-inputnumber>
                </div>
                <div>
                    <label>Umbral excluido</label>
                    <p-inputnumber [(ngModel)]="editor.umbralExcluido" [min]="0" [max]="100" class="w-full"></p-inputnumber>
                </div>
                <div>
                    <label>Umbral subatendido</label>
                    <p-inputnumber [(ngModel)]="editor.umbralSubatendido" [min]="0" [max]="100" class="w-full"></p-inputnumber>
                </div>
                <div class="cies-field--full">
                    <label>Fórmula</label>
                    <input pInputText [(ngModel)]="editor.formulaTexto" class="w-full" />
                </div>
                <div class="cies-field--full">
                    <label>Regla de normalización</label>
                    <input pInputText [(ngModel)]="editor.reglaNormalizacion" class="w-full" />
                </div>
                <div class="cies-field--full">
                    <label>Comentario del cambio</label>
                    <textarea pTextarea [(ngModel)]="editor.comentarioCambio" rows="2" class="w-full"></textarea>
                </div>

                <div class="cies-field--full cies-stack">
                    <h4>Importancia de cada pregunta</h4>
                    <p class="cies-muted">Sube el número si esta pregunta debe influir más en el resultado. Déjalo en cero si no debe contar.</p>
                    <p-table [value]="editor.preguntas" [tableStyle]="{ 'min-width': '56rem' }" responsiveLayout="scroll" class="cies-table">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Código</th>
                                <th>Pregunta</th>
                                <th>Importancia</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-question>
                            <tr>
                                <td>{{ question.codigoVariable }}</td>
                                <td>{{ question.etiqueta }}</td>
                                <td>
                                    <p-inputnumber [(ngModel)]="question.ponderacion" [min]="0" [max]="100" class="w-full"></p-inputnumber>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

                <div class="cies-field--full cies-stack">
                    <h4>Puntos por respuesta</h4>
                    <p class="cies-muted">Aquí defines cuántos puntos gana cada respuesta. Un valor más alto aporta más al resultado final.</p>
                    <div *ngFor="let question of editor.preguntas" class="cies-subcard" [class.hidden]="!question.opciones.length">
                        <div class="cies-subcard-head">
                            <strong>{{ question.codigoVariable }}</strong>
                            <span>{{ question.etiqueta }}</span>
                        </div>
                        <p-table [value]="question.opciones" [tableStyle]="{ 'min-width': '36rem' }" responsiveLayout="scroll" class="cies-table">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Código</th>
                                    <th>Etiqueta</th>
                                    <th>Puntos</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-option>
                                <tr>
                                    <td>{{ option.codigo }}</td>
                                    <td>{{ option.etiqueta }}</td>
                                    <td>
                                        <p-inputnumber [(ngModel)]="option.valorNumerico" [min]="0" [max]="100" class="w-full"></p-inputnumber>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="showEditor = false"></button>
                <button pButton type="button" label="Guardar versión" (click)="save()"></button>
            </ng-template>
        </p-dialog>
    `,
    styles: [
        `
            .hidden {
                display: none;
            }
        `
    ]
})
export class MetodologiaPage implements OnInit {
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);
    private messageService = inject(MessageService);

    metodologias: Metodologia[] = [];
    active: Metodologia | null = null;
    compareSummary: MetodologiaComparativo | null = null;
    showEditor = false;
    editor: Metodologia | null = null;

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.ciesService.listMetodologias().subscribe({
            next: (response) => {
                this.metodologias = response;
                this.active = response.find((item) => item.activa) || null;
                if (this.active) {
                    this.loadCompare(this.active.id);
                } else {
                    this.compareSummary = null;
                }
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading methodologies:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las metodologías' });
            }
        });
    }

    loadCompare(id: number): void {
        this.ciesService.getMetodologiaComparativo(id).subscribe({
            next: (response) => {
                this.compareSummary = response;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading comparison:', error);
            }
        });
    }

    openEdit(item: Metodologia): void {
        this.editor = JSON.parse(JSON.stringify(item)) as Metodologia;
        this.showEditor = true;
    }

    openClone(): void {
        if (!this.active) {
            return;
        }

        this.editor = JSON.parse(JSON.stringify(this.active)) as Metodologia;
        this.editor.id = 0;
        this.editor.nombre = `${this.active.nombre} - copia`;
        this.editor.activa = false;
        this.editor.comentarioCambio = `Clon de ${this.active.nombre}`;
        this.showEditor = true;
    }

    save(): void {
        if (!this.editor) {
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
            comentarioCambio: this.editor.comentarioCambio || 'Actualización desde panel web',
            preguntas: this.editor.preguntas
        };

        const request$ = this.editor.id ? this.ciesService.updateMetodologia(this.editor.id, payload) : this.ciesService.createMetodologia(payload);
        request$.subscribe({
            next: () => {
                this.showEditor = false;
                this.cdr.detectChanges();
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: this.editor?.id ? 'Metodología actualizada correctamente' : 'Nueva versión de metodología creada'
                });
            },
            error: (error) => {
                console.error('Error saving methodology:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la metodología' });
            }
        });
    }

    activate(item: Metodologia): void {
        if (!window.confirm(`Se activara la version ${item.nombre}. Esta sera la version usada para nuevas entrevistas. Deseas continuar?`)) {
            return;
        }

        this.ciesService.activateMetodologia(item.id).subscribe({
            next: () => {
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Metodología activada',
                    detail: `La versión ${item.nombre} ahora esta activa`
                });
            },
            error: (error) => {
                console.error('Error activating methodology:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo activar la metodología' });
            }
        });
    }

    remove(item: Metodologia): void {
        if (item.activa) {
            return;
        }

        if (!window.confirm(`Se eliminara la version ${item.nombre}. Esta accion no se puede deshacer. Deseas continuar?`)) {
            return;
        }

        this.ciesService.deleteMetodologia(item.id).subscribe({
            next: () => {
                this.load();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Eliminado',
                    detail: `Version ${item.nombre} eliminada correctamente`
                });
            },
            error: (error) => {
                console.error('Error deleting methodology:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la metodología' });
            }
        });
    }

    summarizeOptions(options: Metodologia['preguntas'][number]['opciones']): string {
        if (!options.length) {
            return 'Sin categorías';
        }

        return options.map((option) => `${option.codigo}=${option.valorNumerico}`).join(', ');
    }
}

