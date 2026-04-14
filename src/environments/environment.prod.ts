const runtimeConfig = (globalThis as any).__appConfig ?? {};

export const environment = {
    production: true,
    apiBaseUrl: runtimeConfig.apiBaseUrl || 'https://encuestas-back-production.up.railway.app'
};
