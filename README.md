# Frontend CIES Vulnerabilidad

## Stack

- Angular 21
- PrimeNG
- PWA con service worker
- runtime config por `public/app-config.js`

## Desarrollo local

```bash
npm install
npm run build
ng serve
```

La aplicacion local usa `http://localhost:8080` como backend por defecto.

## Configuracion runtime

Editar `public/app-config.js` antes de desplegar:

```js
window.__appConfig = {
  apiBaseUrl: 'https://tu-backend-cies.up.railway.app'
};
```

## Despliegue en Vercel

- archivo incluido: `vercel.json`
- recordar no cachear `app-config.js`
- el backend debe estar agregado en CORS

## Validacion

```bash
npm run build
```
