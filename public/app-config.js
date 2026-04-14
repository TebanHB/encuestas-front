(function () {
    const host = window.location.hostname;
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
    const existingConfig = window.__appConfig || {};

    const publicApiBaseUrl = 'https://9b25-2800-cd0-4a04-d000-e4e8-4f38-1f9e-de9b.ngrok-free.app';

    window.__appConfig = {
        localApiBaseUrl: 'http://localhost:8080',
        publicApiBaseUrl,
        forcePublicApiOnLocalhost: true,
        ...existingConfig
    };

    const runtimeConfig = window.__appConfig;
    const useLocalApi = localHosts.has(host) && !runtimeConfig.forcePublicApiOnLocalhost;

    runtimeConfig.apiBaseUrl = runtimeConfig.apiBaseUrl || (useLocalApi ? runtimeConfig.localApiBaseUrl : runtimeConfig.publicApiBaseUrl);
})();
