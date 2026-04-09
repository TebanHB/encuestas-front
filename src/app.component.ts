import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OfflineInterviewQueueService } from './app/features/cies/services/offline-interview-queue.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
    private readonly offlineQueue = inject(OfflineInterviewQueueService);

    ngOnInit(): void {
        this.offlineQueue.initializeAutoSync();
    }
}

