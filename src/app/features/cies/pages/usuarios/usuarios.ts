import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CiesInfoHintComponent } from '../../components/cies-info-hint';
import { CiesService, UsuarioAdmin, UsuarioUpsertRequest } from '../../services/cies.service';

@Component({
    selector: 'app-usuarios-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, PasswordModule, SelectModule, TableModule, TagModule, CiesInfoHintComponent],
    template: `
        <div class="cies-page">
            <section class="card cies-hero">
                <div class="cies-hero__content">
                    <div class="cies-chip cies-chip--blue">Administración</div>
                    <h1 class="cies-hero__title">Usuarios del sistema</h1>
                    <p class="cies-hero__copy">Gestiona administradores, encuestadores y analistas con bloqueo, activación y cambio de rol.</p>
                </div>
                <div class="cies-hero__actions">
                    <button pButton type="button" icon="pi pi-plus" label="Crear usuario" (click)="openCreate()"></button>
                </div>
            </section>

            <section class="cies-guidance-grid">
                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">1</div>
                    <div class="cies-stack">
                        <h4>Administrador</h4>
                        <p>Configura metodología, registra personas, supervisa entrevistas y gestiona usuarios.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">2</div>
                    <div class="cies-stack">
                        <h4>Encuestador</h4>
                        <p>Registra personas individuales si hace falta y aplica entrevistas de campo.</p>
                    </div>
                </article>

                <article class="card cies-guidance-card">
                    <div class="cies-guidance-step">3</div>
                    <div class="cies-stack">
                        <h4>Analista</h4>
                        <p>Revisa resultados, compara sedes y exporta reportes sin tocar la operación diaria.</p>
                    </div>
                </article>
            </section>

            <section class="card">
                <div class="cies-section-head">
                    <div class="cies-section-head__content">
                        <div>
                            <h3>Control de accesos</h3>
                            <p>Administra cuentas, roles operativos y bloqueos de ingreso del sistema.</p>
                        </div>
                        <app-cies-info-hint text="Desde este bloque puedes crear usuarios, ajustar su rol y reactivar cuentas cuando sea necesario."></app-cies-info-hint>
                    </div>
                </div>
                <div *ngIf="!usuarios.length" class="cies-empty-state">
                    <div class="cies-empty-state__icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <h3>Aún no hay usuarios creados</h3>
                    <p>Crea primero las cuentas del equipo y asigna un rol simple: administrador, encuestador o analista.</p>
                    <div class="cies-empty-state__actions">
                        <button pButton type="button" label="Crear primer usuario" icon="pi pi-plus" (click)="openCreate()"></button>
                    </div>
                </div>

                <p-table *ngIf="usuarios.length" [value]="usuarios" [tableStyle]="{ 'min-width': '64rem' }" responsiveLayout="scroll" class="cies-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Bloqueo</th>
                            <th>Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-user>
                        <tr>
                            <td>{{ user.id }}</td>
                            <td>{{ user.nombre }} {{ user.apellido }}</td>
                            <td>{{ user.email }}</td>
                            <td><p-tag [value]="user.rol" [severity]="user.rol === 'ADMINISTRADOR' ? 'danger' : user.rol === 'ENCUESTADOR' ? 'info' : 'warn'"></p-tag></td>
                            <td><p-tag [value]="user.activo ? 'Activo' : 'Inactivo'" [severity]="user.activo ? 'success' : 'secondary'"></p-tag></td>
                            <td>{{ user.bloqueadoHasta || 'Sin bloqueo' }}</td>
                            <td>
                                <div class="cies-inline-actions">
                                    <button pButton type="button" icon="pi pi-pencil" text rounded severity="info" (click)="openEdit(user)"></button>
                                    <button
                                        pButton
                                        type="button"
                                        [icon]="user.activo ? 'pi pi-lock' : 'pi pi-lock-open'"
                                        text
                                        rounded
                                        severity="contrast"
                                        (click)="toggleEstado(user)"
                                    ></button>
                                    <button pButton type="button" icon="pi pi-trash" text rounded severity="danger" (click)="remove(user)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </section>
        </div>

        <p-dialog
            [(visible)]="showDialog"
            [modal]="true"
            [style]="{ width: '36rem', 'max-width': '96vw' }"
            [contentStyle]="{ overflow: 'visible' }"
            [draggable]="false"
            [resizable]="false"
            [header]="editingId ? 'Editar usuario' : 'Nuevo usuario'"
            styleClass="cies-dialog"
        >
            <div class="cies-soft-note">
                Usa <strong>Administrador</strong> para configuración y control, <strong>Encuestador</strong> para aplicar entrevistas y <strong>Analista</strong> para revisar resultados.
            </div>

            <div class="cies-form-grid cies-form-grid--two cies-dialog-form">
                <div>
                    <label>Nombre</label>
                    <input pInputText [(ngModel)]="form.nombre" class="w-full" />
                </div>
                <div>
                    <label>Apellido</label>
                    <input pInputText [(ngModel)]="form.apellido" class="w-full" />
                </div>
                <div>
                    <label>Correo</label>
                    <input pInputText [(ngModel)]="form.email" type="email" class="w-full" />
                </div>
                <div>
                    <label>Rol</label>
                    <p-select [options]="roles" [(ngModel)]="form.rol" optionLabel="label" optionValue="value" appendTo="body" class="w-full"></p-select>
                </div>
                <div *ngIf="!editingId" class="cies-field--full">
                    <label>Contraseña</label>
                    <p-password [(ngModel)]="form.password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" (click)="showDialog = false"></button>
                <button pButton type="button" label="Guardar" (click)="save()"></button>
            </ng-template>
        </p-dialog>
    `,
    styles: [``]
})
export class UsuariosPage implements OnInit {
    private ciesService = inject(CiesService);
    private cdr = inject(ChangeDetectorRef);

    usuarios: UsuarioAdmin[] = [];
    showDialog = false;
    editingId: number | null = null;

    form: UsuarioUpsertRequest = {
        nombre: '',
        apellido: '',
        email: '',
        rol: 'ENCUESTADOR',
        activo: true,
        password: ''
    };

    roles = [
        { label: 'Administrador', value: 'ADMINISTRADOR' },
        { label: 'Encuestador', value: 'ENCUESTADOR' },
        { label: 'Analista', value: 'ANALISTA' }
    ];

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.ciesService.listUsuarios().subscribe({
            next: (response) => {
                this.usuarios = response;
                this.cdr.detectChanges();
            }
        });
    }

    openCreate(): void {
        this.editingId = null;
        this.form = { nombre: '', apellido: '', email: '', rol: 'ENCUESTADOR', activo: true, password: '' };
        this.showDialog = true;
    }

    openEdit(user: UsuarioAdmin): void {
        this.editingId = user.id;
        this.form = {
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rol: user.rol,
            activo: user.activo,
            password: ''
        };
        this.showDialog = true;
    }

    save(): void {
        const request$ = this.editingId ? this.ciesService.updateUsuario(this.editingId, this.form) : this.ciesService.createUsuario(this.form);
        request$.subscribe({
            next: () => {
                this.showDialog = false;
                this.cdr.detectChanges();
                this.load();
            }
        });
    }

    toggleEstado(user: UsuarioAdmin): void {
        this.ciesService.toggleUsuario(user.id, !user.activo).subscribe({
            next: () => {
                this.load();
            }
        });
    }

    remove(user: UsuarioAdmin): void {
        if (!window.confirm(`Se eliminara la cuenta de ${user.nombre} ${user.apellido}. Esta accion la ocultara del sistema. Deseas continuar?`)) {
            return;
        }

        this.ciesService.deleteUsuario(user.id).subscribe({
            next: () => {
                this.load();
            }
        });
    }
}

