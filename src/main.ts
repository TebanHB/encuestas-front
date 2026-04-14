import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

async function cleanupLegacyServiceWorkers(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return true;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const hadController = !!navigator.serviceWorker.controller;

        if (!registrations.length) {
            sessionStorage.removeItem('cies_sw_cleanup_done');
            return true;
        }

        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('ngsw:') || name.includes('angular-app-manifest'))
                    .map((name) => caches.delete(name))
            );
        }

        if (hadController && !sessionStorage.getItem('cies_sw_cleanup_done')) {
            sessionStorage.setItem('cies_sw_cleanup_done', 'true');
            window.location.reload();
            return false;
        }

        sessionStorage.removeItem('cies_sw_cleanup_done');
        return true;
    } catch (error) {
        console.warn('No se pudo limpiar el service worker legado.', error);
        return true;
    }
}

cleanupLegacyServiceWorkers()
    .then((shouldBootstrap) => {
        if (!shouldBootstrap) {
            return;
        }

        return bootstrapApplication(AppComponent, appConfig);
    })
    .catch((err) => console.error(err));
