const runtimeConfig = (globalThis as any).__appConfig ?? {};

export const environment = {
    production: false,
    apiBaseUrl: runtimeConfig.apiBaseUrl || 'http://localhost:8080'
};
