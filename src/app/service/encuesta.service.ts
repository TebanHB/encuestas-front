import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface OpcionEncuestaRequest {
    texto: string;
    correcta: boolean;
    orden: number;
}

export interface PreguntaEncuestaRequest {
    titulo: string;
    tipo: string;
    obligatoria: boolean;
    orden: number;
    formatoNumeracion?: string;
    formatoOpciones?: string;
    opciones: OpcionEncuestaRequest[];
}

export interface GuardarEncuestaRequest {
    titulo: string;
    descripcion: string;
    modoCalificable: boolean;
    preguntas: PreguntaEncuestaRequest[];
}

export type EstadoEncuesta = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface EncuestaResponse {
    id: number;
    titulo: string;
    descripcion: string;
    modoCalificable: boolean;
    estado: EstadoEncuesta;
    fechaCreacion: string;
    cantidadPreguntas: number;
}

export interface EncuestaDetalleResponse {
    id: number;
    titulo: string;
    descripcion: string;
    modoCalificable: boolean;
    estado: EstadoEncuesta;
    fechaCreacion: string;
    preguntas: {
        id: number;
        titulo: string;
        tipo: string;
        obligatoria: boolean;
        orden: number;
        formatoNumeracion?: string;
        formatoOpciones?: string;
        opciones: {
            id: number;
            texto: string;
            correcta: boolean;
            orden: number;
        }[];
    }[];
}

export interface GuardarRespuestaRequest {
    usuarioId: number;
    encuestaId: number;
    respuestas: {
        preguntaId: number;
        textoRespuesta?: string;
        opcionIds?: number[];
    }[];
}

export interface RespuestaEncuestaResponse {
    id: number;
    encuestaId: number;
    tituloEncuesta: string;
    nombreParticipante: string;
    correoParticipante: string;
    puntaje: number;
    fechaRespuesta: string;
}

export interface ResultadoEncuestaAdminResponse {
    encuestaId: number;
    titulo: string;
    descripcion: string;
    estado: EstadoEncuesta;
    modoCalificable: boolean;
    cantidadPreguntas: number;
    cantidadRespuestas: number;
    fechaCreacion: string;
}

export interface RespuestaEncuestaDetalleAdminResponse {
    idRespuesta: number;
    nombreParticipante: string;
    correoParticipante: string;
    puntaje: number;
    fechaRespuesta: string;
    respuestas: {
        pregunta: string;
        tipo: string;
        textoRespuesta: string;
        opcionesSeleccionadas: string[];
        correcta: boolean;
    }[];
}

export interface DashboardAdminResponse {
    totalEncuestas: number;
    encuestasBorrador: number;
    encuestasAbiertas: number;
    encuestasCerradas: number;
    totalRespuestas: number;
    totalEmpleados: number;
    encuestasRecientes: {
        id: number;
        titulo: string;
        estado: EstadoEncuesta;
        modoCalificable: boolean;
        fechaCreacion: string;
    }[];
    respuestasRecientes: {
        idRespuesta: number;
        participante: string;
        correo: string;
        encuestaTitulo: string;
        puntaje: number;
        fechaRespuesta: string;
    }[];
}

export interface DashboardEmpleadoResponse {
    nombreEmpleado: string;
    correoEmpleado: string;
    encuestasAbiertas: number;
    encuestasRespondidas: number;
    encuestasPendientes: number;
    encuestasCerradas: number;
    promedioPuntaje: number;
    encuestasPendientesRecientes: {
        id: number;
        titulo: string;
        descripcion: string;
        modoCalificable: boolean;
        fechaCreacion: string;
    }[];
    respuestasRecientes: {
        idRespuesta: number;
        encuestaTitulo: string;
        puntaje: number;
        fechaRespuesta: string;
    }[];
}

@Injectable({
    providedIn: 'root'
})
export class EncuestaService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:8080/encuestas';
    private readonly RESPUESTAS_URL = 'http://localhost:8080/respuestas';
    private readonly RESULTADOS_ADMIN_URL = 'http://localhost:8080/resultados-admin';
    private readonly DASHBOARD_URL = 'http://localhost:8080/dashboard';
    private readonly EXPORTACIONES_URL = 'http://localhost:8080/exportaciones';

    guardarEncuesta(payload: GuardarEncuestaRequest): Observable<EncuestaResponse> {
        return this.http.post<EncuestaResponse>(this.API_URL, payload);
    }

    actualizarEncuesta(id: number, payload: GuardarEncuestaRequest): Observable<EncuestaResponse> {
        return this.http.put<EncuestaResponse>(`${this.API_URL}/${id}`, payload);
    }

    eliminarEncuesta(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }

    listarEncuestas(): Observable<EncuestaResponse[]> {
        return this.http.get<EncuestaResponse[]>(this.API_URL);
    }

    listarEncuestasDisponiblesParaEmpleado(correo: string): Observable<EncuestaResponse[]> {
        const params = new HttpParams().set('correo', correo);
        return this.http.get<EncuestaResponse[]>(`${this.API_URL}/disponibles-para-empleado`, { params });
    }

    obtenerEncuesta(id: number): Observable<EncuestaResponse> {
        return this.http.get<EncuestaResponse>(`${this.API_URL}/${id}`);
    }

    obtenerDetalleEncuesta(id: number): Observable<EncuestaDetalleResponse> {
        return this.http.get<EncuestaDetalleResponse>(`${this.API_URL}/${id}/detalle`);
    }

    cambiarEstado(id: number, estado: EstadoEncuesta): Observable<EncuestaResponse> {
        return this.http.patch<EncuestaResponse>(`${this.API_URL}/${id}/estado`, { estado });
    }

    puedeEditar(id: number): Observable<void> {
        return this.http.get<void>(`${this.API_URL}/${id}/puede-editar`);
    }

    puedeExportar(id: number): Observable<void> {
        return this.http.get<void>(`${this.API_URL}/${id}/puede-exportar`);
    }

    guardarRespuesta(payload: GuardarRespuestaRequest): Observable<RespuestaEncuestaResponse> {
        return this.http.post<RespuestaEncuestaResponse>(this.RESPUESTAS_URL, payload);
    }

    listarEncuestasConResultados(): Observable<ResultadoEncuestaAdminResponse[]> {
        return this.http.get<ResultadoEncuestaAdminResponse[]>(`${this.RESULTADOS_ADMIN_URL}/encuestas`);
    }

    listarRespuestasPorEncuesta(encuestaId: number): Observable<RespuestaEncuestaDetalleAdminResponse[]> {
        return this.http.get<RespuestaEncuestaDetalleAdminResponse[]>(`${this.RESULTADOS_ADMIN_URL}/encuestas/${encuestaId}/respuestas`);
    }

    eliminarRespuestaAdmin(respuestaId: number): Observable<void> {
        return this.http.delete<void>(`${this.RESULTADOS_ADMIN_URL}/respuestas/${respuestaId}`);
    }

    obtenerDashboardAdmin(): Observable<DashboardAdminResponse> {
        return this.http.get<DashboardAdminResponse>(`${this.DASHBOARD_URL}/admin`);
    }

    obtenerDashboardEmpleado(usuarioId: number): Observable<DashboardEmpleadoResponse> {
        const params = new HttpParams().set('usuarioId', usuarioId);
        return this.http.get<DashboardEmpleadoResponse>(`${this.DASHBOARD_URL}/empleado`, { params });
    }

    exportarEncuestaExcel(encuestaId: number): Observable<Blob> {
        return this.http.get(`${this.EXPORTACIONES_URL}/encuestas/${encuestaId}/excel`, {
            responseType: 'blob'
        });
    }

    exportarRespuestaIndividualExcel(respuestaId: number): Observable<Blob> {
        return this.http.get(`${this.EXPORTACIONES_URL}/respuestas/${respuestaId}/excel`, {
            responseType: 'blob'
        });
    }
}
