CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    puede_crear_encuestas BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, puede_crear_encuestas)
SELECT 'Administrador', 'Principal', 'admin@encuestas.com', '123456', 'ADMIN', TRUE, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'admin@encuestas.com'
);

INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, puede_crear_encuestas)
SELECT 'Empleado', 'Uno', 'empleado@encuestas.com', '123456', 'EMPLEADO', TRUE, FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'empleado@encuestas.com'
);