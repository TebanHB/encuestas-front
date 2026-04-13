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
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, EjecucionSeleccion, LoteMedicare, MedicareOutboxItem } from '../../services/cies.service';

@Component({
    selector: 'app-seleccion-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, TableModule, TagModule, TextareaModule, Toast, CiesInfoHintComponent],
    providers: [MessageService],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--violet">Registro de personas</div>
                    <h1 class="cies-hero__title">Registrar personas para entrevistar</h1>
                    <p class="cies-hero__copy">Si tienes varias personas, pega aqui el listado. Si solo llego una, usa la entrevista directa y evita trabajar con archivos.</p>
                </div>
                <div class="cies-hero__actions">
                    <a routerLink="/pages/entrevistas"><button pButton type="button" label="Entrevistar a una sola persona" icon="pi pi-user-plus"></button></a>
                </div>
            </section>

            <section class="cies-guidance-grid">
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">1</div>
                    <div class="cies-stack">
                        <h4>Si es una sola persona</h4>
                        <p>Ve a entrevistas. Alli puedes registrarla y abrir su entrevista en el mismo momento.</p>
                    </div>
                    <div class="cies-guidance-actions">
                        <a routerLink="/pages/entrevistas"><button pButton type="button" label="Ir a entrevista directa"></button></a>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">2</div>
                    <div class="cies-stack">
                        <h4>Si son varias personas</h4>
                        <p>Pon un nombre al listado, pega el contenido o sube un archivo y guarda todo de una sola vez.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">3</div>
                    <div class="cies-stack">
                        <h4>Despues dejalas listas</h4>
                        <p>Cuando el listado aparezca abajo, pulsa el boton de preparacion para enviarlas a la bandeja de entrevistas.</p>
                    </div>
                </article>
            </section>

            <section class="card cies-stack">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>{{ editingLoteId ? 'Editar listado' : 'Registrar varias personas' }}</h3>
                            <p>{{ editingLoteId ? 'Corrige el nombre o el contenido antes de dejar listo el listado para entrevistas.' : 'Admite JSON o CSV con los datos basicos del flujo Medicare.' }}</p>
                        </div>
                        <app-cies-info-hint text="Puedes pegar el contenido manualmente o subir un archivo. El sistema validara clinica, regional y fecha de consulta."></app-cies-info-hint>
                    </div>
                </div>

                <div *ngIf="editingLoteId" class="cies-soft-note">
                    Estas editando un listado ya guardado. Si cambias las personas, se reemplazara el contenido actual del listado.
                </div>

                <div class="cies-form-grid cies-form-grid--two">
                    <div>
                        <label>Nombre del listado</label>
                        <input pInputText [(ngModel)]="nombreLote" class="w-full" placeholder="Ejemplo: Mujeres marzo - Clinica Central" />
                    </div>
                    <div>
                        <label>Subir archivo</label>
                        <input type="file" accept=".csv,.json" class="cies-native-input" (change)="onFileSelected($event)" />
                    </div>
                </div>

                <div>
                    <label>Pega el listado aqui</label>
                    <textarea
                        pTextarea
                        [(ngModel)]="cargaMasiva"
                        rows="10"
                        class="w-full"
                        placeholder="medicarePersonId,nombre,apellido,ci,pasaporte,clinica,regional,fechaConsulta,tipoConsulta"
                    ></textarea>
                </div>

                <div class="cies-note cies-note--warning" *ngIf="cargaError">
                    {{ cargaError }}
                </div>

                <div class="cies-helper-block">
                    Columnas admitidas: medicarePersonId, nombre, apellido, nombreCompleto, ci, pasaporte, documento, clinica, regional, fechaConsulta, tipoConsulta.
                </div>

                <div class="cies-actions-row">
                    <button pButton type="button" [label]="editingLoteId ? 'Guardar cambios' : 'Guardar listado'" icon="pi pi-upload" (click)="registrarLote()"></button>
                    <button pButton type="button" [label]="editingLoteId ? 'Cancelar edicion' : 'Limpiar'" severity="secondary" [outlined]="true" icon="pi pi-eraser" (click)="limpiarCarga()"></button>
                </div>
            </section>

            <section class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Listados guardados</h3>
                            <p>Ahora estan separados por estado para que no mezcles lo que falta preparar con lo que ya esta listo.</p>
                        </div>
                        <app-cies-info-hint text="Cada listado conserva responsable, fecha y total de personas para trazabilidad."></app-cies-info-hint>
                    </div>
                </div>

                <div *ngIf="!lotes.length" class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <h3>Aun no registraste ningun listado</h3>
                    <p>Si tienes varias personas, pega el contenido arriba y pulsa <strong>Guardar listado</strong>. Si solo tienes una, entra directo a entrevistas y registrala alli mismo.</p>
                    <div class="cies-empty-state__actions">
                        <a routerLink="/pages/entrevistas"><button pButton type="button" label="Entrevistar a una sola persona" severity="secondary" [outlined]="true"></button></a>
                    </div>
                </div>

                <div *ngIf="lotesPendientes.length" class="cies-stack">
                    <div class="cies-section-head">
                        <div>
                            <h3>Listados por preparar</h3>
                            <p>Estos todavia no pasaron a la bandeja de entrevistas.</p>
                        </div>
                    </div>

                    <p-table [value]="lotesPendientes" [tableStyle]="{ 'min-width': '72rem' }" responsiveLayout="scroll" class="cies-table">
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
                                <td>{{ item.id }}</td>
                                <td>{{ item.nombre }}</td>
                                <td><p-tag [value]="item.estado" severity="warn"></p-tag></td>
                                <td>{{ item.totalPersonas }}</td>
                                <td>{{ item.creadoPor }}</td>
                                <td>{{ item.fechaCreacion }}</td>
                                <td>
                                    <div class="cies-inline-actions">
                                        <button pButton type="button" label="Dejar listas" icon="pi pi-play" size="small" (click)="ejecutar(item)"></button>
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

                    <p-table [value]="lotesProcesados" [tableStyle]="{ 'min-width': '62rem' }" responsiveLayout="scroll" class="cies-table">
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
                                <td>{{ item.id }}</td>
                                <td>{{ item.nombre }}</td>
                                <td><p-tag [value]="item.estado" severity="success"></p-tag></td>
                                <td>{{ item.totalPersonas }}</td>
                                <td>{{ item.creadoPor }}</td>
                                <td>{{ item.fechaCreacion }}</td>
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
                            <p>Quien ejecuto la seleccion y cuantas personas quedaron listas.</p>
                        </div>
                        <app-cies-info-hint text="La semilla registrada permite repetir y auditar el proceso de seleccion cuando sea necesario."></app-cies-info-hint>
                    </div>
                </div>

                <p-table [value]="ejecuciones" [tableStyle]="{ 'min-width': '58rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>ID</th>
                            <th>Listado</th>
                            <th>Semilla</th>
                            <th>Personas listas</th>
                            <th>Ejecutado por</th>
                            <th>Fecha</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>{{ item.id }}</td>
                            <td>{{ item.loteId }}</td>
                            <td>{{ item.semilla }}</td>
                            <td>{{ item.totalSeleccionadas }}</td>
                            <td>{{ item.ejecutadoPor }}</td>
                            <td>{{ item.fechaEjecucion }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>

            <section class="card" *ngIf="outbox.length">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Trazas de integracion Medicare</h3>
                            <p>Registros tecnicos de salida para soporte y auditoria.</p>
                        </div>
                        <app-cies-info-hint text="Este bloque no es para trabajo diario. Solo sirve para seguimiento tecnico si algo falla en la integracion."></app-cies-info-hint>
                    </div>
                </div>
                <p-table [value]="outbox" [tableStyle]="{ 'min-width': '64rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Tipo</th>
                            <th>Referencia</th>
                            <th>Fecha</th>
                            <th>Payload</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>{{ item.tipo }}</td>
                            <td>{{ item.referenciaId }}</td>
                            <td>{{ item.fecha }}</td>
                            <td><textarea pTextarea [ngModel]="item.payloadJson" rows="3" class="w-full" readonly></textarea></td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>

        <p-toast></p-toast>
    `,
    styles: [
        `
            .cies-native-input {
                width: 100%;
                min-height: 2.75rem;
                border: 1px solid var(--layout-border-strong);
                border-radius: 0.9rem;
                padding: 0.7rem 0.85rem;
                background: var(--layout-panel-soft-background);
                color: var(--layout-text-strong);
            }

            .cies-helper-block {
                color: var(--layout-text-muted);
                font-size: 0.92rem;
                line-height: 1.5;
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
    lotes: LoteMedicare[] = [];
    ejecuciones: EjecucionSeleccion[] = [];
    outbox: MedicareOutboxItem[] = [];

    ngOnInit(): void {
        this.load();
    }

    get lotesPendientes(): LoteMedicare[] {
        return this.lotes.filter((item) => item.estado !== 'PROCESADO');
    }

    get lotesProcesados(): LoteMedicare[] {
        return this.lotes.filter((item) => item.estado === 'PROCESADO');
    }

    load(): void {
        this.ciesService.listLotes().subscribe({
            next: (response) => {
                this.lotes = response;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading lotes:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los lotes' });
            }
        });
        this.ciesService.listEjecuciones().subscribe({
            next: (response) => {
                this.ejecuciones = response;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading ejecuciones:', error);
            }
        });
        this.ciesService.getMedicareOutbox().subscribe({
            next: (response) => {
                this.outbox = response;
                this.cdr.detectChanges();
            }
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
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
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el listado' });
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
        if (!window.confirm(`Se eliminara el listado ${item.nombre}. Esta accion solo debe usarse si el listado aun no fue preparado. Deseas continuar?`)) {
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
            throw new Error('No se encontraron registros validos. Revisa columnas y formato del archivo.');
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
            fechaConsulta: this.readValue(item, ['fechaConsulta', 'fechaconsulta']) || new Date().toISOString().slice(0, 10),
            tipoConsulta: this.readValue(item, ['tipoConsulta', 'tipoconsulta']) || 'PRIMERA_CONSULTA_SSR'
        };
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
}
