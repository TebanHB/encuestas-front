import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

async function removeLegacyOfflineArtifacts(): Promise<void> {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem('cies_offline_interviews');

    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
}

removeLegacyOfflineArtifacts()
    .then(() => bootstrapApplication(AppComponent, appConfig))
    .catch((err) => console.error(err));
