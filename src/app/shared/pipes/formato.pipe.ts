import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'fechaCorta',
    standalone: true
})
export class FechaCortaPipe implements PipeTransform {
    transform(value: string | Date | null | undefined): string {
        if (!value) return '—';
        try {
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const [year, month, day] = value.split('-').map(Number);
                return new Date(year, month - 1, day).toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'America/La_Paz'
                });
            }

            const date = typeof value === 'string' ? new Date(value) : value;
            return date.toLocaleDateString('es-BO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/La_Paz'
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
        if (!value) return '—';
        try {
            const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
                ? this.dateOnlyToLocal(value)
                : typeof value === 'string' ? new Date(value) : value;
            return date.toLocaleDateString('es-BO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/La_Paz'
            });
        } catch {
            return String(value);
        }
    }

    private dateOnlyToLocal(value: string): Date {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
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
