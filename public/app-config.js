(function () {
    const host = window.location.hostname;
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
    const existingConfig = window.__appConfig || {};

    const publicApiBaseUrl = 'https://encuestas-back-production.up.railway.app';

    window.__appConfig = {
        localApiBaseUrl: 'http://localhost:8080',
        publicApiBaseUrl,
        forcePublicApiOnLocalhost: false,
        ...existingConfig
    };

    const runtimeConfig = window.__appConfig;
    const useLocalApi = localHosts.has(host) && !runtimeConfig.forcePublicApiOnLocalhost;

    runtimeConfig.apiBaseUrl = runtimeConfig.apiBaseUrl || (useLocalApi ? runtimeConfig.localApiBaseUrl : runtimeConfig.publicApiBaseUrl);
})();
