import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '@/environments/environment';

export interface UsuarioAdmin {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    activo: boolean;
    intentosFallidos: number;
    bloqueadoHasta?: string;
}

export interface UsuarioUpsertRequest {
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    activo: boolean;
    password?: string;
}

export interface OpcionInstrumento {
    id: number;
    orden: number;
    codigo: string;
    etiqueta: string;
    valorNumerico: number;
}

export interface PreguntaInstrumento {
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
    logicaCondicional?: string;
    validacionTexto?: string;
    opciones: OpcionInstrumento[];
}

export interface Metodologia {
    id: number;
    nombre: string;
    descripcion: string;
    formulaTexto: string;
    reglaNormalizacion: string;
    umbralPobre: number;
    umbralExcluido: number;
    umbralSubatendido: number;
    activa: boolean;
    comentarioCambio?: string;
    creadoPor?: string;
    fechaCreacion: string;
    preguntas: PreguntaInstrumento[];
}

export interface MetodologiaComparativo {
    id: number;
    nombre: string;
    umbralPobre: number;
    umbralExcluido: number;
    umbralSubatendido: number;
    cantidadPreguntas: number;
    cantidadOpciones: number;
    preguntasConPonderacion: number;
}

export interface PersonaElegible {
    id: number;
    medicarePersonId: string;
    nombreCompleto: string;
    documento?: string;
    clinica: string;
    regional: string;
    fechaConsulta: string;
    tipoConsulta: string;
    seleccionada: boolean;
    estadoSeleccion: string;
    estadoEntrevista: string;
    codigoEntrevista?: string;
    loteId?: number;
    loteNombre?: string;
}

export interface PendientesEntrevistaResumen {
    total: number;
    items: PersonaElegible[];
}

export interface LoteMedicare {
    id: number;
    nombre: string;
    estado: string;
    fechaCreacion: string;
    creadoPor: string;
    totalPersonas: number;
    personas: PersonaElegible[];
}

export interface EjecucionSeleccion {
    id: number;
    loteId: number;
    semilla: string;
    totalElegibles: number;
    totalSeleccionadas: number;
    ejecutadoPor: string;
    fechaEjecucion: string;
    seleccionadas: PersonaElegible[];
}

export interface RespuestaPayload {
    preguntaId: number;
    codigoOpcion?: string;
    valorTexto?: string;
    valorOtro?: string;
}

export interface Entrevista {
    id: number;
    codigo: string;
    estado: string;
    fechaInicio: string;
    fechaFin?: string;
    clinica: string;
    regional: string;
    encuestador: string;
    personaNombre: string;
    metodologia: string;
    preguntas: PreguntaInstrumento[];
    respuestas: {
        preguntaId: number;
        codigoVariable: string;
        etiqueta: string;
        valorCrudo?: string;
        etiquetaRespuesta?: string;
        valorNumerico?: number;
    }[];
    resultado?: {
        puntajeTotal: number;
        puntajeNormalizado: number;
        pobre: boolean;
        excluido: boolean;
        subatendido: boolean;
        versionMetodologica: string;
        fechaCalculo: string;
    };
}

export interface ReporteResumen {
    totalEntrevistas: number;
    totalPobres: number;
    totalExcluidas: number;
    totalSubatendidas: number;
    porcentajePobres: number;
    porcentajeExcluidas: number;
    porcentajeSubatendidas: number;
    tendencias: { etiqueta: string; total: number; pobres: number; excluidas: number; subatendidas: number }[];
    comparativoClinicas: { clinica: string; regional: string; total: number; porcentajePobres: number; porcentajeExcluidas: number; porcentajeSubatendidas: number }[];
}

export interface SerieReporte {
    etiqueta: string;
    total: number;
    pobres: number;
    excluidas: number;
    subatendidas: number;
}

export interface ComparativoClinica {
    clinica: string;
    total: number;
    porcentajePobres: number;
    porcentajeExcluidas: number;
    porcentajeSubatendidas: number;
}

export interface DistribucionVariable {
    codigoVariable: string;
    etiquetaPregunta: string;
    items: { etiqueta: string; total: number }[];
}

export interface MedicareOutboxItem {
    id: number;
    tipo: string;
    referenciaId: string;
    payloadJson: string;
    fecha: string;
}

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

export interface AuditoriaPaginada {
    content: AuditoriaRegistro[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}

export interface UsuariosPaginados {
    content: UsuarioAdmin[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}

@Injectable({
    providedIn: 'root'
})
export class CiesService {
    private readonly instrumentoCacheKey = 'cies_instrumento_activo_cache';
    private http = inject(HttpClient);
    private readonly apiBase = environment.apiBaseUrl;
    private instrumentoActivoRequest$: Observable<Metodologia> | null = null;
    private metodologiasRequest$: Observable<Metodologia[]> | null = null;
    private pendientesRequest$: Observable<PersonaElegible[]> | null = null;
    private pendientesResumenRequests = new Map<number, Observable<PendientesEntrevistaResumen>>();
    private lotesRequest$: Observable<LoteMedicare[]> | null = null;
    private ejecucionesRequest$: Observable<EjecucionSeleccion[]> | null = null;
    private reporteResumenRequests = new Map<string, Observable<ReporteResumen>>();

    listUsuarios(): Observable<UsuarioAdmin[]> {
        return this.http.get<UsuarioAdmin[]>(`${this.apiBase}/usuarios`);
    }

    listUsuariosPaginado(page = 0, size = 20, q?: string): Observable<UsuariosPaginados> {
        const params: Record<string, string | number | null | undefined> = { page, size };
        if (q) params['q'] = q;
        return this.http.get<UsuariosPaginados>(`${this.apiBase}/usuarios/paginado`, { params: this.toParams(params) });
    }

    createUsuario(payload: UsuarioUpsertRequest): Observable<UsuarioAdmin> {
        return this.http.post<UsuarioAdmin>(`${this.apiBase}/usuarios`, payload);
    }

    updateUsuario(id: number, payload: UsuarioUpsertRequest): Observable<UsuarioAdmin> {
        return this.http.put<UsuarioAdmin>(`${this.apiBase}/usuarios/${id}`, payload);
    }

    toggleUsuario(id: number, activo: boolean): Observable<UsuarioAdmin> {
        return this.http.patch<UsuarioAdmin>(`${this.apiBase}/usuarios/${id}/estado`, { activo });
    }

    deleteUsuario(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiBase}/usuarios/${id}`);
    }

    getInstrumentoActivo(forceRefresh = false): Observable<Metodologia> {
        if (forceRefresh) {
            this.instrumentoActivoRequest$ = null;
        }

        if (!this.instrumentoActivoRequest$) {
            this.instrumentoActivoRequest$ = this.http.get<Metodologia>(`${this.apiBase}/instrumento/activo`).pipe(
            tap((payload) => localStorage.setItem(this.instrumentoCacheKey, JSON.stringify(payload))),
            catchError((error) => {
                this.instrumentoActivoRequest$ = null;
                const cached = this.readInstrumentoCache();
                return cached ? of(cached) : throwError(() => error);
            }),
            shareReplay(1)
        );
        }

        return this.instrumentoActivoRequest$;
    }

    listMetodologias(forceRefresh = false): Observable<Metodologia[]> {
        if (forceRefresh) {
            this.metodologiasRequest$ = null;
        }

        if (!this.metodologiasRequest$) {
            this.metodologiasRequest$ = this.http.get<Metodologia[]>(`${this.apiBase}/metodologias`).pipe(
                catchError((error) => {
                    this.metodologiasRequest$ = null;
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
        }

        return this.metodologiasRequest$;
    }

    createMetodologia(payload: Partial<Metodologia>): Observable<Metodologia> {
        return this.http.post<Metodologia>(`${this.apiBase}/metodologias`, payload).pipe(tap(() => this.resetAllCaches()));
    }

    updateMetodologia(id: number, payload: Partial<Metodologia>): Observable<Metodologia> {
        return this.http.put<Metodologia>(`${this.apiBase}/metodologias/${id}`, payload).pipe(tap(() => this.resetAllCaches()));
    }

    activateMetodologia(id: number): Observable<Metodologia> {
        return this.http.post<Metodologia>(`${this.apiBase}/metodologias/${id}/activar`, {}).pipe(tap(() => this.resetAllCaches()));
    }

    getMetodologiaComparativo(id: number): Observable<MetodologiaComparativo> {
        return this.http.get<MetodologiaComparativo>(`${this.apiBase}/metodologias/${id}/comparativo`);
    }

    duplicateMetodologia(id: number): Observable<Metodologia> {
        return this.http.post<Metodologia>(`${this.apiBase}/metodologias/${id}/duplicar`, {}).pipe(tap(() => this.resetAllCaches()));
    }

    deleteMetodologia(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiBase}/metodologias/${id}`).pipe(tap(() => this.resetAllCaches()));
    }

    createLote(nombre: string, personas: Array<Record<string, unknown>>): Observable<LoteMedicare> {
        return this.http.post<LoteMedicare>(`${this.apiBase}/seleccion/lotes`, { nombre, personas }).pipe(tap(() => this.resetOperacionCache()));
    }

    updateLote(id: number, nombre: string, personas: Array<Record<string, unknown>>): Observable<LoteMedicare> {
        return this.http.put<LoteMedicare>(`${this.apiBase}/seleccion/lotes/${id}`, { nombre, personas }).pipe(tap(() => this.resetOperacionCache()));
    }

    listLotes(): Observable<LoteMedicare[]> {
        if (!this.lotesRequest$) {
            this.lotesRequest$ = this.http.get<LoteMedicare[]>(`${this.apiBase}/seleccion/lotes`).pipe(
                catchError((error) => {
                    this.lotesRequest$ = null;
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
        }

        return this.lotesRequest$;
    }

    deleteLote(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiBase}/seleccion/lotes/${id}`).pipe(tap(() => this.resetOperacionCache()));
    }

    executeSeleccion(loteId: number, semilla?: string): Observable<EjecucionSeleccion> {
        return this.http.post<EjecucionSeleccion>(`${this.apiBase}/seleccion/ejecuciones`, { loteId, semilla }).pipe(tap(() => this.resetOperacionCache()));
    }

    listEjecuciones(): Observable<EjecucionSeleccion[]> {
        if (!this.ejecucionesRequest$) {
            this.ejecucionesRequest$ = this.http.get<EjecucionSeleccion[]>(`${this.apiBase}/seleccion/ejecuciones`).pipe(
                catchError((error) => {
                    this.ejecucionesRequest$ = null;
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
        }

        return this.ejecucionesRequest$;
    }

    getPendientesEntrevista(forceRefresh = false): Observable<PersonaElegible[]> {
        if (forceRefresh) {
            this.pendientesRequest$ = null;
        }

        if (!this.pendientesRequest$) {
            this.pendientesRequest$ = this.http.get<PersonaElegible[]>(`${this.apiBase}/entrevistas/pendientes`).pipe(
                catchError((error) => {
                    this.pendientesRequest$ = null;
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
        }

        return this.pendientesRequest$;
    }

    getPendientesResumen(limit = 8, forceRefresh = false): Observable<PendientesEntrevistaResumen> {
        const safeLimit = Math.max(1, Math.min(limit, 25));
        if (forceRefresh) {
            this.pendientesResumenRequests.delete(safeLimit);
        }

        if (!this.pendientesResumenRequests.has(safeLimit)) {
            const request$ = this.http.get<PendientesEntrevistaResumen>(`${this.apiBase}/entrevistas/pendientes/resumen`, {
                params: new HttpParams().set('limit', String(safeLimit))
            }).pipe(
                catchError((error) => {
                    this.pendientesResumenRequests.delete(safeLimit);
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
            this.pendientesResumenRequests.set(safeLimit, request$);
        }

        return this.pendientesResumenRequests.get(safeLimit)!;
    }

    iniciarEntrevista(personaId: number): Observable<Entrevista> {
        return this.http.post<Entrevista>(`${this.apiBase}/entrevistas/${personaId}/iniciar`, {}).pipe(tap(() => this.resetOperacionCache()));
    }

    finalizarEntrevista(entrevistaId: number, respuestas: RespuestaPayload[]): Observable<Entrevista> {
        return this.http.post<Entrevista>(`${this.apiBase}/entrevistas/${entrevistaId}/finalizar`, { respuestas }).pipe(tap(() => this.resetAllCaches()));
    }

    getEntrevista(id: number): Observable<Entrevista> {
        return this.http.get<Entrevista>(`${this.apiBase}/entrevistas/${id}`);
    }

    getReporteResumen(filters?: Record<string, string | number | null | undefined>): Observable<ReporteResumen> {
        const key = this.cacheKey(filters);

        if (!this.reporteResumenRequests.has(key)) {
            const request$ = this.http.get<ReporteResumen>(`${this.apiBase}/reportes/resumen`, { params: this.toParams(filters) }).pipe(
                catchError((error) => {
                    this.reporteResumenRequests.delete(key);
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
            this.reporteResumenRequests.set(key, request$);
        }

        return this.reporteResumenRequests.get(key)!;
    }

    getDistribucionVariable(filters?: Record<string, string | number | null | undefined>): Observable<DistribucionVariable> {
        return this.http.get<DistribucionVariable>(`${this.apiBase}/reportes/distribucion-variable`, { params: this.toParams(filters) });
    }

    exportExcel(filters?: Record<string, string | number | null | undefined>): Observable<Blob> {
        return this.http.get(`${this.apiBase}/exportaciones/reportes.xlsx`, { params: this.toParams(filters), responseType: 'blob' });
    }

    exportCsv(filters?: Record<string, string | number | null | undefined>): Observable<Blob> {
        return this.http.get(`${this.apiBase}/exportaciones/reportes.csv`, { params: this.toParams(filters), responseType: 'blob' });
    }

    exportSps(filters?: Record<string, string | number | null | undefined>): Observable<Blob> {
        return this.http.get(`${this.apiBase}/exportaciones/reportes.sps`, { params: this.toParams(filters), responseType: 'blob' });
    }

    getMedicareOutbox(): Observable<MedicareOutboxItem[]> {
        return this.http.get<MedicareOutboxItem[]>(`${this.apiBase}/integraciones/medicare/outbox`);
    }

    listAuditoria(filters?: Record<string, string | number | null | undefined>): Observable<AuditoriaPaginada> {
        return this.http.get<AuditoriaPaginada>(`${this.apiBase}/auditoria`, { params: this.toParams(filters) });
    }

    getAuditoriaDetalle(id: number): Observable<AuditoriaRegistro> {
        return this.http.get<AuditoriaRegistro>(`${this.apiBase}/auditoria/${id}`);
    }

    private readInstrumentoCache(): Metodologia | null {
        try {
            const raw = localStorage.getItem(this.instrumentoCacheKey);
            return raw ? (JSON.parse(raw) as Metodologia) : null;
        } catch {
            return null;
        }
    }

    private resetMetodologiaCache(): void {
        this.instrumentoActivoRequest$ = null;
        this.metodologiasRequest$ = null;
        localStorage.removeItem(this.instrumentoCacheKey);
    }

    private resetOperacionCache(): void {
        this.pendientesRequest$ = null;
        this.pendientesResumenRequests.clear();
        this.lotesRequest$ = null;
        this.ejecucionesRequest$ = null;
    }

    private resetReporteCache(): void {
        this.reporteResumenRequests.clear();
    }

    private resetAllCaches(): void {
        this.resetMetodologiaCache();
        this.resetOperacionCache();
        this.resetReporteCache();
    }

    private toParams(filters?: Record<string, string | number | null | undefined>): HttpParams {
        let params = new HttpParams();
        Object.entries(filters || {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, String(value));
            }
        });
        return params;
    }

    private cacheKey(filters?: Record<string, string | number | null | undefined>): string {
        return JSON.stringify(
            Object.entries(filters || {})
                .filter(([, value]) => value !== null && value !== undefined && value !== '')
                .sort(([left], [right]) => left.localeCompare(right))
        );
    }
}
