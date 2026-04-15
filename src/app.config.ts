import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withEnabledBlockingInitialNavigation, withHashLocation, withInMemoryScrolling, withPreloading } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withHashLocation(),
            withInMemoryScrolling({
                anchorScrolling: 'enabled',
                scrollPositionRestoration: 'enabled'
            }),
            withPreloading(PreloadAllModules),
            withEnabledBlockingInitialNavigation()
        ),
        provideHttpClient(
            withFetch(),
            withInterceptors([authInterceptor])
        ),
        providePrimeNG({
            overlayAppendTo: 'body',
            zIndex: {
                modal: 1100,
                overlay: 1200,
                menu: 1200,
                tooltip: 1300
            },
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: '.app-dark'
                }
            }
        })
    ]
};

