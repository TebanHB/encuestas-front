import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CiesService, RespuestaPayload } from './cies.service';

interface QueuedInterview {
    entrevistaId: number;
    respuestas: RespuestaPayload[];
    codigo?: string;
    personaNombre?: string;
    queuedAt?: string;
    lastError?: string;
}

@Injectable({
    providedIn: 'root'
})
export class OfflineInterviewQueueService {
    private readonly storageKey = 'cies_offline_interviews';
    private initialized = false;
    private flushing = false;
    private ciesService = inject(CiesService);

    private readonly onlineHandler = () => {
        void this.flush();
    };

    constructor() {
        this.initializeAutoSync();
    }

    initializeAutoSync(): void {
        if (this.initialized || typeof window === 'undefined') {
            return;
        }

        this.initialized = true;
        window.addEventListener('online', this.onlineHandler);

        if (navigator.onLine) {
            void this.flush();
        }
    }

    enqueue(
        entrevistaId: number,
        respuestas: RespuestaPayload[],
        meta: { codigo?: string; personaNombre?: string } = {}
    ): void {
        const queue = this.readQueue();
        const existingIndex = queue.findIndex((item) => item.entrevistaId === entrevistaId);
        const entrada: QueuedInterview = {
            entrevistaId,
            respuestas,
            codigo: meta.codigo,
            personaNombre: meta.personaNombre,
            queuedAt: new Date().toISOString()
        };
        if (existingIndex >= 0) {
            queue[existingIndex] = entrada;
        } else {
            queue.push(entrada);
        }
        localStorage.setItem(this.storageKey, JSON.stringify(queue));

        if (typeof window !== 'undefined' && navigator.onLine) {
            void this.flush();
        }
    }

    async flush(): Promise<{ enviadas: number; pendientes: number }> {
        if (this.flushing) {
            return { enviadas: 0, pendientes: this.count() };
        }
        this.flushing = true;

        let enviadas = 0;
        try {
            const queue = this.readQueue();
            if (!queue.length || !navigator.onLine) {
                return { enviadas: 0, pendientes: queue.length };
            }

            const remaining: QueuedInterview[] = [];

            for (const item of queue) {
                try {
                    await firstValueFrom(this.ciesService.finalizarEntrevista(item.entrevistaId, item.respuestas));
                    enviadas += 1;
                } catch (error) {
                    const message = this.extractErrorMessage(error);
                    if (this.isPermanentError(error)) {
                        // La entrevista ya no existe o ya fue finalizada; descartarla para no reintentar indefinidamente.
                        console.warn('Descartando entrevista offline no recuperable:', item.entrevistaId, message);
                        continue;
                    }
                    remaining.push({ ...item, lastError: message });
                }
            }

            localStorage.setItem(this.storageKey, JSON.stringify(remaining));
            return { enviadas, pendientes: remaining.length };
        } finally {
            this.flushing = false;
        }
    }

    count(): number {
        return this.readQueue().length;
    }

    list(): QueuedInterview[] {
        return this.readQueue();
    }

    clear(): void {
        localStorage.removeItem(this.storageKey);
    }

    private readQueue(): QueuedInterview[] {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]') as QueuedInterview[];
        } catch {
            return [];
        }
    }

    private isPermanentError(error: unknown): boolean {
        const status = (error as { status?: number } | null)?.status;
        return status === 404 || status === 409;
    }

    private extractErrorMessage(error: unknown): string {
        const payload = error as {
            error?: { message?: string; detail?: string };
            message?: string;
            status?: number;
        } | null;
        return (
            payload?.error?.message ||
            payload?.error?.detail ||
            payload?.message ||
            (payload?.status ? `HTTP ${payload.status}` : 'Error desconocido')
        );
    }
}
