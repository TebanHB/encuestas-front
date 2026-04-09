# Estructura de `src/app`

- `core`: autenticacion y piezas transversales
- `features/auth`: acceso y login
- `features/cies`: dominio activo del sistema
- `legacy`: modulos heredados de encuestas genericas
- `layout`: shell visual compartido
- `pages`: pantallas auxiliares del shell y componentes no ligados al dominio principal

Regla principal: todo desarrollo nuevo del sistema CIES entra en `features/cies`.
