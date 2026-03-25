import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    darkTheme: boolean;
    menuMode: string;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly STORAGE_KEY = 'cies-layout-config';

    layoutConfig = signal<LayoutConfig>({
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        darkTheme: false,
        menuMode: 'static'
    });

    layoutState = signal<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null
    });

    theme = computed(() => (this.layoutConfig().darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;

    constructor() {
        if (this.isBrowser) {
            this.cargarConfiguracionGuardada();
            this.toggleDarkMode(this.layoutConfig());
        }

        effect(() => {
            const config = this.layoutConfig();

            if (!this.isBrowser || !config) {
                return;
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        });

        effect(() => {
            const config = this.layoutConfig();

            if (!this.isBrowser || !config) {
                return;
            }

            if (!this.initialized) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
        });
    }

    private cargarConfiguracionGuardada(): void {
        const rawConfig = localStorage.getItem(this.STORAGE_KEY);

        if (!rawConfig) {
            return;
        }

        try {
            const parsedConfig = JSON.parse(rawConfig) as Partial<LayoutConfig>;

            this.layoutConfig.update((current) => ({
                ...current,
                preset: parsedConfig.preset ?? current.preset,
                primary: parsedConfig.primary ?? current.primary,
                surface: parsedConfig.surface ?? current.surface,
                darkTheme: parsedConfig.darkTheme ?? current.darkTheme,
                menuMode: parsedConfig.menuMode ?? current.menuMode
            }));
        } catch (error) {
            console.error('No se pudo cargar la configuración visual guardada:', error);
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        if (!this.isBrowser) {
            return;
        }

        const supportsViewTransition = 'startViewTransition' in document;

        if (supportsViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        (document as Document & { startViewTransition?: (callback: () => void) => void }).startViewTransition?.(() => {
            this.toggleDarkMode(config);
        });
    }

    toggleDarkMode(config?: LayoutConfig): void {
        if (!this.isBrowser) {
            return;
        }

        const currentConfig = config || this.layoutConfig();

        if (currentConfig.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !this.layoutState().mobileMenuActive }));
        }
    }

    showConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: true }));
    }

    hideConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: false }));
    }

    isDesktop() {
        return this.isBrowser ? window.innerWidth > 991 : true;
    }

    isMobile() {
        return !this.isDesktop();
    }
}
