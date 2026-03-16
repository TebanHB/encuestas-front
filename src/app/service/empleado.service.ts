import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

@Injectable({
    providedIn: 'root'
})
export class EmpleadoService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:8080/empleados';

    listarEmpleados(): Observable<Empleado[]> {
        return this.http.get<Empleado[]>(this.API_URL);
    }

    crearEmpleado(payload: CrearEmpleadoRequest): Observable<Empleado> {
        return this.http.post<Empleado>(this.API_URL, payload);
    }

    eliminarEmpleado(id: number, currentUserEmail: string): Observable<void> {
        const headers = new HttpHeaders({
            'X-User-Email': currentUserEmail || ''
        });

        return this.http.delete<void>(`${this.API_URL}/${id}`, { headers });
    }
}
