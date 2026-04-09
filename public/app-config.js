(function () {
    const host = window.location.hostname;
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
    const existingConfig = window.__appConfig || {};

    // Cambia solo esta URL cuando ngrok genere una direccion nueva.
    const publicApiBaseUrl = 'https://b627-2800-cd0-4a04-d000-c44e-46f8-597d-2e1a.ngrok-free.app';

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
