import { Pipe, PipeTransform } from '@angular/core';

const ZONA_BOLIVIA = 'America/La_Paz';
const OFFSET_BOLIVIA = '-04:00';

/**
 * Convierte un valor (Date | string) en un Date que representa correctamente
 * la hora de Bolivia. Si recibe una cadena ISO naive (sin "Z" ni offset)
 * la asume en hora boliviana, ya que el backend emite LocalDateTime
 * sin zona horaria pero con la JVM corriendo en America/La_Paz.
 */
function parseFechaBolivia(value: string | Date | null | undefined): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const text = String(value).trim();
    if (!text) return null;

    // Solo fecha YYYY-MM-DD: lo construimos como fecha local sin desfase
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const [y, m, d] = text.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return isNaN(date.getTime()) ? null : date;
    }

    // ISO con T: si no termina en Z ni en +/-HH:MM, lo tratamos como hora boliviana
    const tieneOffset = /Z$/i.test(text) || /[+\-]\d{2}:?\d{2}$/.test(text);
    const candidate = (text.includes('T') && !tieneOffset) ? text + OFFSET_BOLIVIA : text;
    const date = new Date(candidate);
    return isNaN(date.getTime()) ? null : date;
}

@Pipe({
    name: 'fechaCorta',
    standalone: true
})
export class FechaCortaPipe implements PipeTransform {
    transform(value: string | Date | null | undefined): string {
        const date = parseFechaBolivia(value);
        if (!date) return '—';
        const soloFecha = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
        try {
            if (soloFecha) {
                return date.toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZone: ZONA_BOLIVIA
                });
            }
            return date.toLocaleDateString('es-BO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: ZONA_BOLIVIA
            });
        } catch {
            return String(value);
        }
    }
}

@Pipe({
    name: 'fechaLarga',
    standalone: true
})
export class FechaLargaPipe implements PipeTransform {
    transform(value: string | Date | null | undefined): string {
        const date = parseFechaBolivia(value);
        if (!date) return '—';
        try {
            return date.toLocaleDateString('es-BO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: ZONA_BOLIVIA
            });
        } catch {
            return String(value);
        }
    }
}

/**
 * Formato compacto explicito DD/MM/YYYY HH:mm en hora de Bolivia.
 * Util para tablas de auditoria y registros operativos.
 */
@Pipe({
    name: 'fechaHora',
    standalone: true
})
export class FechaHoraPipe implements PipeTransform {
    transform(value: string | Date | null | undefined): string {
        const date = parseFechaBolivia(value);
        if (!date) return '—';
        try {
            const fecha = date.toLocaleDateString('es-BO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: ZONA_BOLIVIA
            });
            const hora = date.toLocaleTimeString('es-BO', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: ZONA_BOLIVIA
            });
            return `${fecha} ${hora}`;
        } catch {
            return String(value);
        }
    }
}

@Pipe({
    name: 'nombrePropio',
    standalone: true
})
export class NombrePropioPipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return '—';
        return value
            .trim()
            .split(/\s+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}

@Pipe({
    name: 'estadoTexto',
    standalone: true
})
export class EstadoTextoPipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return '—';
        const estados: Record<string, string> = {
            'PENDIENTE': 'Pendiente',
            'SELECCIONADA': 'Seleccionada',
            'NO_SELECCIONADA': 'No seleccionada',
            'EN_CURSO': 'En curso',
            'FINALIZADA': 'Finalizada',
            'CARGADO': 'Cargado',
            'PROCESADO': 'Preparado',
            'ACTIVO': 'Activo',
            'INACTIVO': 'Inactivo'
        };
        return estados[value.toUpperCase()] || value;
    }
}

@Pipe({
    name: 'numeroFormato',
    standalone: true
})
export class NumeroFormatoPipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value == null) return '—';
        return value.toLocaleString('es-BO');
    }
}
