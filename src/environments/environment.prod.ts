const runtimeConfig = (globalThis as any).__appConfig ?? {};

export const environment = {
    production: true,
    apiBaseUrl: runtimeConfig.apiBaseUrl || 'http://localhost:8080'
};
