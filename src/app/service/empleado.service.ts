import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface Empleado {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    activo: boolean;
    puedeCrearEncuestas: boolean;
}

export interface CrearEmpleadoRequest {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol: string;
    activo: boolean;
    puedeCrearEncuestas: boolean;
}

export interface ActualizarEmpleadoRequest {
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    activo: boolean;
    puedeCrearEncuestas: boolean;
}

export interface CambiarPasswordRequest {
    password: string;
}

@Injectable({
    providedIn: 'root'
})
export class EmpleadoService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiBaseUrl}/empleados`;

    listarEmpleados(): Observable<Empleado[]> {
        return this.http.get<Empleado[]>(this.API_URL);
    }

    crearEmpleado(payload: CrearEmpleadoRequest): Observable<Empleado> {
        return this.http.post<Empleado>(this.API_URL, payload);
    }

    actualizarEmpleado(id: number, payload: ActualizarEmpleadoRequest): Observable<Empleado> {
        return this.http.put<Empleado>(`${this.API_URL}/${id}`, payload);
    }

    cambiarPassword(id: number, payload: CambiarPasswordRequest): Observable<void> {
        return this.http.put<void>(`${this.API_URL}/${id}/password`, payload);
    }

    eliminarEmpleado(id: number, currentUserEmail: string): Observable<void> {
        const headers = new HttpHeaders({
            'X-User-Email': currentUserEmail || ''
        });

        return this.http.delete<void>(`${this.API_URL}/${id}`, { headers });
    }
}