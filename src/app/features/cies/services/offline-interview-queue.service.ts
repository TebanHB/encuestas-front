import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CiesService, RespuestaPayload } from './cies.service';

interface QueuedInterview {
    entrevistaId: number;
    respuestas: RespuestaPayload[];
}

@Injectable({
    providedIn: 'root'
})
export class OfflineInterviewQueueService {
    private readonly storageKey = 'cies_offline_interviews';
    private initialized = false;
    private ciesService = inject(CiesService);
    private readonly onlineHandler = () => {
        void this.flush();
    };

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

    enqueue(entrevistaId: number, respuestas: RespuestaPayload[]): void {
        const queue = this.readQueue();
        queue.push({ entrevistaId, respuestas });
        localStorage.setItem(this.storageKey, JSON.stringify(queue));
    }

    async flush(): Promise<void> {
        const queue = this.readQueue();
        if (!queue.length) {
            return;
        }

        const remaining: QueuedInterview[] = [];

        for (const item of queue) {
            try {
                await firstValueFrom(this.ciesService.finalizarEntrevista(item.entrevistaId, item.respuestas));
            } catch {
                remaining.push(item);
            }
        }

        localStorage.setItem(this.storageKey, JSON.stringify(remaining));
    }

    count(): number {
        return this.readQueue().length;
    }

    private readQueue(): QueuedInterview[] {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]') as QueuedInterview[];
        } catch {
            return [];
        }
    }
}
