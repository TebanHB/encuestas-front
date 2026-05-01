import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, of, shareReplay, tap, throwError } from 'rxjs';
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
        valorOtro?: string;
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
    totalConVulnerabilidad: number;
    totalSinVulnerabilidad: number;
    totalUnFactor: number;
    totalDosFactores: number;
    totalTresFactores: number;
    porcentajePobres: number;
    porcentajeExcluidas: number;
    porcentajeSubatendidas: number;
    porcentajeConVulnerabilidad: number;
    porcentajeSinVulnerabilidad: number;
    tendencias: { etiqueta: string; total: number; pobres: number; excluidas: number; subatendidas: number }[];
    comparativoClinicas: {
        clinica: string;
        regional: string;
        total: number;
        totalPobres: number;
        totalExcluidas: number;
        totalSubatendidas: number;
        totalConVulnerabilidad: number;
        totalSinVulnerabilidad: number;
        porcentajePobres: number;
        porcentajeExcluidas: number;
        porcentajeSubatendidas: number;
        porcentajeConVulnerabilidad: number;
        porcentajeSinVulnerabilidad: number;
    }[];
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

export interface ReporteExcelGraficos {
    totalEntrevistas: number;
    frecuencias: {
        codigoVariable: string;
        etiquetaPregunta: string;
        items: { etiqueta: string; total: number; porcentaje: number }[];
    }[];
    cantidadFactores: { etiqueta: string; total: number; porcentaje: number }[];
    vulnerabilidadPobre: { etiqueta: string; total: number; porcentaje: number }[];
    regionales: {
        regional: string;
        total: number;
        pobres: number;
        excluidas: number;
        subatendidas: number;
        ceroFactores: number;
        unFactor: number;
        dosFactores: number;
        tresFactores: number;
        porcentajePobres: number;
        porcentajeExcluidas: number;
        porcentajeSubatendidas: number;
    }[];
    combinaciones: {
        regional: string;
        total: number;
        pobrezaExclusion: number;
        pobrezaSubatencion: number;
        exclusionSubatencion: number;
        pobrezaExclusionAsociada: number;
        pobrezaSubatencionAsociada: number;
        exclusionSubatencionAsociada: number;
        porcentajePobrezaExclusion: number;
        porcentajePobrezaSubatencion: number;
        porcentajeExclusionSubatencion: number;
        porcentajePobrezaExclusionAsociada: number;
        porcentajePobrezaSubatencionAsociada: number;
        porcentajeExclusionSubatencionAsociada: number;
    }[];
}

export interface PersonaUpsertRequest {
    medicarePersonId?: string;
    nombre: string;
    apellido: string;
    documento?: string;
    clinica: string;
    regional: string;
    fechaConsulta: string;
    tipoConsulta: string;
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

export interface PagedResponse<T> {
    content: T[];
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
    private usuariosPaginadosRequests = new Map<string, Observable<UsuariosPaginados>>();
    private lotesPaginadosRequests = new Map<string, Observable<PagedResponse<LoteMedicare>>>();
    private ejecucionesPaginadasRequests = new Map<string, Observable<PagedResponse<EjecucionSeleccion>>>();
    private reporteResumenRequests = new Map<string, Observable<ReporteResumen>>();
    private distribucionVariableRequests = new Map<string, Observable<DistribucionVariable>>();
    private graficosExcelRequests = new Map<string, Observable<ReporteExcelGraficos>>();
    private warmupRoles = new Set<string>();

    listUsuarios(): Observable<UsuarioAdmin[]> {
        return this.http.get<UsuarioAdmin[]>(`${this.apiBase}/usuarios`);
    }

    listUsuariosPaginado(page = 0, size = 20, q?: string): Observable<UsuariosPaginados> {
        const params: Record<string, string | number | null | undefined> = { page, size };
        if (q) params['q'] = q;
        const key = this.cacheKey(params);
        if (!this.usuariosPaginadosRequests.has(key)) {
            const request$ = this.http.get<UsuariosPaginados>(`${this.apiBase}/usuarios/paginado`, { params: this.toParams(params) }).pipe(
                catchError((error) => {
                    this.usuariosPaginadosRequests.delete(key);
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
            this.usuariosPaginadosRequests.set(key, request$);
        }

        return this.usuariosPaginadosRequests.get(key)!;
    }

    createUsuario(payload: UsuarioUpsertRequest): Observable<UsuarioAdmin> {
        return this.http.post<UsuarioAdmin>(`${this.apiBase}/usuarios`, payload).pipe(tap(() => this.resetUsuarioRelatedCaches()));
    }

    updateUsuario(id: number, payload: UsuarioUpsertRequest): Observable<UsuarioAdmin> {
        return this.http.put<UsuarioAdmin>(`${this.apiBase}/usuarios/${id}`, payload).pipe(tap(() => this.resetUsuarioRelatedCaches()));
    }

    toggleUsuario(id: number, activo: boolean): Observable<UsuarioAdmin> {
        return this.http.patch<UsuarioAdmin>(`${this.apiBase}/usuarios/${id}/estado`, { activo }).pipe(tap(() => this.resetUsuarioRelatedCaches()));
    }

    deleteUsuario(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiBase}/usuarios/${id}`).pipe(tap(() => this.resetUsuarioRelatedCaches()));
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

    listLotesPaginado(page = 0, size = 10, estado?: string): Observable<PagedResponse<LoteMedicare>> {
        const params = { page, size, estado };
        const key = this.cacheKey(params);
        if (!this.lotesPaginadosRequests.has(key)) {
            const request$ = this.http.get<PagedResponse<LoteMedicare>>(`${this.apiBase}/seleccion/lotes/paginado`, {
                params: this.toParams(params)
            }).pipe(
                catchError((error) => {
                    this.lotesPaginadosRequests.delete(key);
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
            this.lotesPaginadosRequests.set(key, request$);
        }

        return this.lotesPaginadosRequests.get(key)!;
    }

    deleteLote(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiBase}/seleccion/lotes/${id}`).pipe(tap(() => this.resetOperacionCache()));
    }

    downloadPlantillaPersonas(): Observable<Blob> {
        return this.http.get(`${this.apiBase}/exportaciones/plantilla-personas.xlsx`, { responseType: 'blob' });
    }

    leerPlantillaPersonas(file: File): Observable<Array<Record<string, unknown>>> {
        const formData = new FormData();
        formData.append('archivo', file);
        return this.http.post<Array<Record<string, unknown>>>(`${this.apiBase}/seleccion/plantilla-personas/leer`, formData);
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

    listEjecucionesPaginado(page = 0, size = 10): Observable<PagedResponse<EjecucionSeleccion>> {
        const params = { page, size };
        const key = this.cacheKey(params);
        if (!this.ejecucionesPaginadasRequests.has(key)) {
            const request$ = this.http.get<PagedResponse<EjecucionSeleccion>>(`${this.apiBase}/seleccion/ejecuciones/paginado`, {
                params: this.toParams(params)
            }).pipe(
                catchError((error) => {
                    this.ejecucionesPaginadasRequests.delete(key);
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
            this.ejecucionesPaginadasRequests.set(key, request$);
        }

        return this.ejecucionesPaginadasRequests.get(key)!;
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

    getReporteResumen(filters?: Record<string, string | number | null | undefined>, forceRefresh = false): Observable<ReporteResumen> {
        const key = this.cacheKey(filters);
        if (forceRefresh) {
            this.reporteResumenRequests.delete(key);
        }

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
        const key = this.cacheKey(filters);
        if (!this.distribucionVariableRequests.has(key)) {
            const request$ = this.http.get<DistribucionVariable>(`${this.apiBase}/reportes/distribucion-variable`, { params: this.toParams(filters) }).pipe(
                catchError((error) => {
                    this.distribucionVariableRequests.delete(key);
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
            this.distribucionVariableRequests.set(key, request$);
        }

        return this.distribucionVariableRequests.get(key)!;
    }

    getGraficosExcel(filters?: Record<string, string | number | null | undefined>): Observable<ReporteExcelGraficos> {
        const key = this.cacheKey(filters);
        if (!this.graficosExcelRequests.has(key)) {
            const request$ = this.http.get<ReporteExcelGraficos>(`${this.apiBase}/reportes/graficos-excel`, { params: this.toParams(filters) }).pipe(
                catchError((error) => {
                    this.graficosExcelRequests.delete(key);
                    return throwError(() => error);
                }),
                shareReplay(1)
            );
            this.graficosExcelRequests.set(key, request$);
        }

        return this.graficosExcelRequests.get(key)!;
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

    listPersonasPendientesPaginado(page = 0, size = 10): Observable<PagedResponse<PersonaElegible>> {
        return this.http.get<PagedResponse<PersonaElegible>>(`${this.apiBase}/seleccion/personas/pendientes`, {
            params: this.toParams({ page, size })
        });
    }

    crearPersonaDirecta(payload: PersonaUpsertRequest): Observable<PersonaElegible> {
        return this.http.post<PersonaElegible>(`${this.apiBase}/seleccion/personas`, payload).pipe(
            tap(() => this.resetOperacionCache())
        );
    }

    actualizarPersona(id: number, payload: PersonaUpsertRequest): Observable<PersonaElegible> {
        return this.http.put<PersonaElegible>(`${this.apiBase}/seleccion/personas/${id}`, payload).pipe(
            tap(() => this.resetOperacionCache())
        );
    }

    eliminarPersona(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiBase}/seleccion/personas/${id}`).pipe(
            tap(() => this.resetOperacionCache())
        );
    }

    getMedicareOutbox(): Observable<MedicareOutboxItem[]> {
        return this.http.get<MedicareOutboxItem[]>(`${this.apiBase}/integraciones/medicare/outbox`);
    }

    getMedicareOutboxPaginado(page = 0, size = 10): Observable<PagedResponse<MedicareOutboxItem>> {
        return this.http.get<PagedResponse<MedicareOutboxItem>>(`${this.apiBase}/integraciones/medicare/outbox/paginado`, {
            params: this.toParams({ page, size })
        });
    }

    warmupForRole(role: string | null | undefined): void {
        const normalizedRole = this.normalizeRole(role);
        if (!normalizedRole || this.warmupRoles.has(normalizedRole)) {
            return;
        }

        this.warmupRoles.add(normalizedRole);
        const reportFilters = { codigoVariable: 'SERVICIO' };
        const requests: Observable<unknown>[] = [];

        if (normalizedRole === 'ADMINISTRADOR') {
            requests.push(
                this.getInstrumentoActivo(),
                this.listMetodologias(),
                this.getReporteResumen(reportFilters),
                this.getDistribucionVariable(reportFilters),
                this.getGraficosExcel(reportFilters),
                this.listUsuariosPaginado(0, 10),
                this.listLotesPaginado(0, 10),
                this.listEjecucionesPaginado(0, 10),
                this.getPendientesResumen(8)
            );
        }

        if (normalizedRole === 'ENCUESTADOR') {
            requests.push(this.getInstrumentoActivo(), this.getPendientesResumen(8), this.getPendientesEntrevista());
        }

        if (normalizedRole === 'ANALISTA') {
            requests.push(
                this.listMetodologias(),
                this.getReporteResumen(reportFilters),
                this.getDistribucionVariable(reportFilters),
                this.getGraficosExcel(reportFilters)
            );
        }

        if (!requests.length) {
            return;
        }

        forkJoin(requests.map((request) => request.pipe(catchError(() => of(null))))).subscribe();
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
        this.lotesPaginadosRequests.clear();
        this.ejecucionesRequest$ = null;
        this.ejecucionesPaginadasRequests.clear();
    }

    private resetReporteCache(): void {
        this.reporteResumenRequests.clear();
        this.distribucionVariableRequests.clear();
        this.graficosExcelRequests.clear();
    }

    private resetUsuarioRelatedCaches(): void {
        this.usuariosPaginadosRequests.clear();
        this.resetOperacionCache();
        this.resetReporteCache();
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

    private normalizeRole(role: string | null | undefined): string {
        const normalized = (role || '').trim().toUpperCase();
        return normalized === 'ADMIN' ? 'ADMINISTRADOR' : normalized;
    }
}
