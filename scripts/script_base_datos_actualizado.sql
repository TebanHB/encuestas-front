-- Script actualizado de base de datos del sistema de encuestas CIES
-- Generado desde la estructura actual del backend.
--
-- Motor objetivo: PostgreSQL.
-- Uso previsto: crear o completar una base de datos con la estructura vigente.
-- Este script es intencionalmente idempotente donde aplica; no elimina datos.
--
-- Incluye:
-- - Usuarios y tablas legacy de encuestas.
-- - Tablas CIES de lotes, seleccion, entrevistas, respuestas, metodologia e instrumento.
-- - Tabla de auditoria.
-- - Indices usados por consultas y reporteria.
-- - Columnas vigentes de consentimiento informado.
-- - Metodologia base con umbrales actualizados: pobreza 45, exclusion 70, subatencion 80.
-- - Pregunta NO_HABLA_CASTELLANO mantenida con ponderacion actual: No = 0, Si = 14.

BEGIN;

-- ============================================================
-- Usuarios
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    puede_crear_encuestas BOOLEAN NOT NULL DEFAULT FALSE,
    eliminado BOOLEAN NOT NULL DEFAULT FALSE,
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP;

INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, puede_crear_encuestas, eliminado, intentos_fallidos, fecha_creacion)
SELECT 'Administrador', 'Principal', 'admin@encuestas.com', '123456', 'ADMIN', TRUE, TRUE, FALSE, 0, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE lower(email) = lower('admin@encuestas.com'));

INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, puede_crear_encuestas, eliminado, intentos_fallidos, fecha_creacion)
SELECT 'Empleado', 'Uno', 'empleado@encuestas.com', '123456', 'EMPLEADO', TRUE, FALSE, FALSE, 0, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE lower(email) = lower('empleado@encuestas.com'));

-- ============================================================
-- Encuestas legacy
-- ============================================================

CREATE TABLE IF NOT EXISTS encuestas (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    modo_calificable BOOLEAN NOT NULL DEFAULT FALSE,
    estado VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS preguntas (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
    orden INTEGER NOT NULL DEFAULT 0,
    formato_numeracion VARCHAR(30) DEFAULT 'NUMERO_PARENTESIS',
    formato_opciones VARCHAR(30) DEFAULT 'SIN_PREFIJO',
    encuesta_id BIGINT NOT NULL REFERENCES encuestas(id)
);

CREATE TABLE IF NOT EXISTS opciones_pregunta (
    id BIGSERIAL PRIMARY KEY,
    texto VARCHAR(255) NOT NULL,
    correcta BOOLEAN NOT NULL DEFAULT FALSE,
    orden INTEGER NOT NULL DEFAULT 0,
    pregunta_id BIGINT NOT NULL REFERENCES preguntas(id)
);

CREATE TABLE IF NOT EXISTS respuestas_encuesta (
    id BIGSERIAL PRIMARY KEY,
    encuesta_id BIGINT NOT NULL REFERENCES encuestas(id),
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    nombre_participante VARCHAR(200),
    correo_participante VARCHAR(150),
    fecha_respuesta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    puntaje INTEGER DEFAULT 0,
    CONSTRAINT uk_respuesta_encuesta_usuario UNIQUE (encuesta_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS respuestas_pregunta (
    id BIGSERIAL PRIMARY KEY,
    texto_respuesta TEXT,
    correcta BOOLEAN NOT NULL DEFAULT FALSE,
    respuesta_encuesta_id BIGINT NOT NULL REFERENCES respuestas_encuesta(id),
    pregunta_id BIGINT NOT NULL REFERENCES preguntas(id)
);

CREATE TABLE IF NOT EXISTS respuestas_opcion (
    id BIGSERIAL PRIMARY KEY,
    respuesta_pregunta_id BIGINT NOT NULL REFERENCES respuestas_pregunta(id),
    opcion_pregunta_id BIGINT NOT NULL REFERENCES opciones_pregunta(id)
);

-- ============================================================
-- CIES: seleccion, entrevistas e integracion
-- ============================================================

CREATE TABLE IF NOT EXISTS cies_lote_medicare (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    estado VARCHAR(40) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por VARCHAR(150) NOT NULL,
    eliminado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_eliminacion TIMESTAMP,
    eliminado_por TEXT
);

CREATE TABLE IF NOT EXISTS cies_persona_elegible (
    id BIGSERIAL PRIMARY KEY,
    medicare_person_id TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    documento TEXT,
    clinica TEXT NOT NULL,
    regional TEXT NOT NULL,
    fecha_consulta DATE NOT NULL,
    tipo_consulta TEXT NOT NULL,
    seleccionada BOOLEAN NOT NULL DEFAULT FALSE,
    estado_seleccion VARCHAR(40) NOT NULL,
    estado_entrevista VARCHAR(40) NOT NULL,
    codigo_entrevista TEXT,
    eliminado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_eliminacion TIMESTAMP,
    eliminado_por TEXT,
    lote_id BIGINT NOT NULL REFERENCES cies_lote_medicare(id)
);

CREATE TABLE IF NOT EXISTS cies_ejecucion_seleccion (
    id BIGSERIAL PRIMARY KEY,
    lote_id BIGINT NOT NULL,
    semilla VARCHAR(120) NOT NULL,
    total_elegibles INTEGER NOT NULL,
    total_seleccionadas INTEGER NOT NULL,
    ejecutado_por VARCHAR(150) NOT NULL,
    fecha_ejecucion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cies_medicare_outbox (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(60) NOT NULL,
    referencia_id VARCHAR(120) NOT NULL,
    payload_json TEXT NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cies_metodologia_version (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    formula_texto VARCHAR(500) NOT NULL,
    regla_normalizacion VARCHAR(500) NOT NULL,
    umbral_pobre INTEGER NOT NULL,
    umbral_excluido INTEGER NOT NULL,
    umbral_subatendido INTEGER NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT FALSE,
    comentario_cambio TEXT,
    creado_por VARCHAR(150) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_eliminacion TIMESTAMP,
    eliminado_por TEXT
);

CREATE TABLE IF NOT EXISTS cies_instrumento_pregunta (
    id BIGSERIAL PRIMARY KEY,
    metodologia_id BIGINT NOT NULL REFERENCES cies_metodologia_version(id),
    orden INTEGER NOT NULL,
    numero_visible INTEGER NOT NULL,
    codigo_variable VARCHAR(80) NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    seccion VARCHAR(80) NOT NULL,
    etiqueta TEXT NOT NULL,
    obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
    metadato BOOLEAN NOT NULL DEFAULT FALSE,
    ponderacion INTEGER NOT NULL DEFAULT 1,
    logica_condicional TEXT,
    validacion_texto TEXT
);

CREATE TABLE IF NOT EXISTS cies_instrumento_opcion (
    id BIGSERIAL PRIMARY KEY,
    pregunta_id BIGINT NOT NULL REFERENCES cies_instrumento_pregunta(id),
    orden INTEGER NOT NULL,
    codigo VARCHAR(40) NOT NULL,
    etiqueta TEXT NOT NULL,
    valor_numerico INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cies_entrevista (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(60) NOT NULL,
    estado VARCHAR(40) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    clinica TEXT NOT NULL,
    regional TEXT NOT NULL,
    encuestador VARCHAR(150) NOT NULL,
    persona_nombre TEXT NOT NULL,
    metodologia_nombre VARCHAR(200) NOT NULL,
    puntaje_total INTEGER,
    puntaje_normalizado INTEGER,
    consentimiento_aceptado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_consentimiento TIMESTAMP,
    pobre BOOLEAN NOT NULL DEFAULT FALSE,
    excluido BOOLEAN NOT NULL DEFAULT FALSE,
    subatendido BOOLEAN NOT NULL DEFAULT FALSE,
    eliminado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_eliminacion TIMESTAMP,
    eliminado_por TEXT,
    persona_id BIGINT NOT NULL REFERENCES cies_persona_elegible(id)
);

ALTER TABLE cies_entrevista ADD COLUMN IF NOT EXISTS consentimiento_aceptado BOOLEAN DEFAULT FALSE;
ALTER TABLE cies_entrevista ADD COLUMN IF NOT EXISTS fecha_consentimiento TIMESTAMP;
UPDATE cies_entrevista SET consentimiento_aceptado = FALSE WHERE consentimiento_aceptado IS NULL;
ALTER TABLE cies_entrevista ALTER COLUMN consentimiento_aceptado SET DEFAULT FALSE;
ALTER TABLE cies_entrevista ALTER COLUMN consentimiento_aceptado SET NOT NULL;

CREATE TABLE IF NOT EXISTS cies_respuesta_entrevista (
    id BIGSERIAL PRIMARY KEY,
    entrevista_id BIGINT NOT NULL REFERENCES cies_entrevista(id),
    pregunta_id BIGINT NOT NULL,
    codigo_variable VARCHAR(80) NOT NULL,
    etiqueta TEXT NOT NULL,
    valor_crudo TEXT,
    etiqueta_respuesta TEXT,
    valor_numerico INTEGER,
    valor_otro TEXT
);

CREATE TABLE IF NOT EXISTS cies_auditoria (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(255) NOT NULL,
    usuario VARCHAR(255) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    entidad_afectada VARCHAR(255),
    id_entidad BIGINT,
    descripcion TEXT,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    direccion_ip VARCHAR(255),
    user_agent VARCHAR(255),
    resultado VARCHAR(255)
);

-- ============================================================
-- Indices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_encuestas_estado ON encuestas (estado);
CREATE INDEX IF NOT EXISTS idx_encuestas_fecha_creacion ON encuestas (fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_encuestas_titulo ON encuestas (titulo);

CREATE INDEX IF NOT EXISTS idx_pregunta_encuesta ON preguntas (encuesta_id);
CREATE INDEX IF NOT EXISTS idx_pregunta_encuesta_orden ON preguntas (encuesta_id, orden);
CREATE INDEX IF NOT EXISTS idx_opcion_pregunta_pregunta ON opciones_pregunta (pregunta_id);
CREATE INDEX IF NOT EXISTS idx_opcion_pregunta_orden ON opciones_pregunta (pregunta_id, orden);

CREATE INDEX IF NOT EXISTS idx_respuesta_encuesta_fecha ON respuestas_encuesta (fecha_respuesta);
CREATE INDEX IF NOT EXISTS idx_respuesta_encuesta_encuesta ON respuestas_encuesta (encuesta_id);
CREATE INDEX IF NOT EXISTS idx_respuesta_encuesta_usuario ON respuestas_encuesta (usuario_id);
CREATE INDEX IF NOT EXISTS idx_respuesta_pregunta_respuesta ON respuestas_pregunta (respuesta_encuesta_id);
CREATE INDEX IF NOT EXISTS idx_respuesta_pregunta_pregunta ON respuestas_pregunta (pregunta_id);
CREATE INDEX IF NOT EXISTS idx_respuesta_opcion_respuesta_pregunta ON respuestas_opcion (respuesta_pregunta_id);
CREATE INDEX IF NOT EXISTS idx_respuesta_opcion_opcion_pregunta ON respuestas_opcion (opcion_pregunta_id);

CREATE INDEX IF NOT EXISTS idx_lote_estado ON cies_lote_medicare (estado);
CREATE INDEX IF NOT EXISTS idx_lote_fecha_creacion ON cies_lote_medicare (fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_cies_lote_estado_fecha ON cies_lote_medicare (estado, fecha_creacion DESC) WHERE eliminado = false;

CREATE INDEX IF NOT EXISTS idx_persona_seleccionada_estado ON cies_persona_elegible (seleccionada, estado_entrevista);
CREATE INDEX IF NOT EXISTS idx_persona_lote ON cies_persona_elegible (lote_id);
CREATE INDEX IF NOT EXISTS idx_persona_fecha_consulta ON cies_persona_elegible (fecha_consulta);
CREATE INDEX IF NOT EXISTS idx_cies_persona_estado_fecha ON cies_persona_elegible (seleccionada, estado_entrevista, fecha_consulta, id);

CREATE INDEX IF NOT EXISTS idx_cies_ejecucion_fecha ON cies_ejecucion_seleccion (fecha_ejecucion DESC);
CREATE INDEX IF NOT EXISTS idx_outbox_fecha ON cies_medicare_outbox (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_outbox_tipo ON cies_medicare_outbox (tipo);

CREATE INDEX IF NOT EXISTS idx_cies_metodologia_activa ON cies_metodologia_version (activa);
CREATE INDEX IF NOT EXISTS idx_cies_metodologia_fecha_creacion ON cies_metodologia_version (fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_cies_metodologia_activa_visible ON cies_metodologia_version (activa, fecha_creacion DESC) WHERE eliminado = false;

CREATE INDEX IF NOT EXISTS idx_cies_pregunta_metodologia ON cies_instrumento_pregunta (metodologia_id);
CREATE INDEX IF NOT EXISTS idx_cies_pregunta_metodologia_orden ON cies_instrumento_pregunta (metodologia_id, orden);
CREATE INDEX IF NOT EXISTS idx_cies_pregunta_codigo_variable ON cies_instrumento_pregunta (codigo_variable);
CREATE INDEX IF NOT EXISTS idx_cies_opcion_pregunta ON cies_instrumento_opcion (pregunta_id);
CREATE INDEX IF NOT EXISTS idx_cies_opcion_pregunta_orden ON cies_instrumento_opcion (pregunta_id, orden);

CREATE INDEX IF NOT EXISTS idx_cies_entrevista_fecha_fin ON cies_entrevista (fecha_fin DESC) WHERE fecha_fin IS NOT NULL AND eliminado = false;
CREATE INDEX IF NOT EXISTS idx_cies_entrevista_lower_clinica_finalizada ON cies_entrevista (lower(clinica)) WHERE fecha_fin IS NOT NULL AND eliminado = false;
CREATE INDEX IF NOT EXISTS idx_cies_entrevista_lower_regional_finalizada ON cies_entrevista (lower(regional)) WHERE fecha_fin IS NOT NULL AND eliminado = false;
CREATE INDEX IF NOT EXISTS idx_cies_entrevista_lower_metodologia_finalizada ON cies_entrevista (lower(metodologia_nombre)) WHERE fecha_fin IS NOT NULL AND eliminado = false;
CREATE INDEX IF NOT EXISTS idx_cies_entrevista_clasificacion_finalizada ON cies_entrevista (pobre, excluido, subatendido) WHERE fecha_fin IS NOT NULL AND eliminado = false;
CREATE INDEX IF NOT EXISTS idx_cies_entrevista_estado_encuestador_fecha ON cies_entrevista (estado, encuestador, fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_cies_respuesta_variable_entrevista ON cies_respuesta_entrevista (upper(codigo_variable), entrevista_id);

CREATE INDEX IF NOT EXISTS idx_cies_auditoria_fecha ON cies_auditoria (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_cies_auditoria_tipo_fecha ON cies_auditoria (tipo, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_cies_auditoria_resultado_fecha ON cies_auditoria (resultado, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_cies_auditoria_lower_usuario_fecha ON cies_auditoria (lower(usuario), fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_cies_auditoria_entidad ON cies_auditoria (entidad_afectada, id_entidad);

-- ============================================================
-- Metodologia activa CIES
-- ============================================================

DO $$
DECLARE
    v_metodologia_id BIGINT;
BEGIN
    SELECT id
    INTO v_metodologia_id
    FROM cies_metodologia_version
    WHERE lower(nombre) = lower('Instrumento de Vulnerabilidad CIES Excel 2022')
      AND COALESCE(eliminado, FALSE) = FALSE
    ORDER BY id DESC
    LIMIT 1;

    IF v_metodologia_id IS NULL THEN
        INSERT INTO cies_metodologia_version (
            nombre,
            descripcion,
            formula_texto,
            regla_normalizacion,
            umbral_pobre,
            umbral_excluido,
            umbral_subatendido,
            activa,
            comentario_cambio,
            creado_por,
            fecha_creacion,
            eliminado
        )
        VALUES (
            'Instrumento de Vulnerabilidad CIES Excel 2022',
            'Version basada en la matriz CIES de vulnerabilidad 04/09/2022.',
            'Suma directa de puntos por factor: pobreza V5-V14 con corte <45; exclusion referencial con V15,V16,V17 y subatencion referencial con V18,V19,V20,V21. La variable NO_HABLA_CASTELLANO permanece registrada en el sistema, pero fuera del benchmark de comparacion con el Excel empresa hasta nueva validacion.',
            'PUNTOS_DIRECTOS_EXCEL_2022',
            45,
            70,
            80,
            TRUE,
            'Script consolidado actualizado de base de datos.',
            'SISTEMA',
            CURRENT_TIMESTAMP,
            FALSE
        )
        RETURNING id INTO v_metodologia_id;
    ELSE
        UPDATE cies_metodologia_version
        SET umbral_pobre = 45,
            umbral_excluido = 70,
            umbral_subatendido = 80,
            activa = TRUE,
            eliminado = FALSE,
            formula_texto = 'Suma directa de puntos por factor: pobreza V5-V14 con corte <45; exclusion referencial con V15,V16,V17 y subatencion referencial con V18,V19,V20,V21. La variable NO_HABLA_CASTELLANO permanece registrada en el sistema, pero fuera del benchmark de comparacion con el Excel empresa hasta nueva validacion.'
        WHERE id = v_metodologia_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM cies_instrumento_pregunta
        WHERE metodologia_id = v_metodologia_id
    ) THEN
        INSERT INTO cies_instrumento_pregunta (
            metodologia_id, orden, numero_visible, codigo_variable, tipo, seccion, etiqueta,
            obligatoria, metadato, ponderacion, logica_condicional, validacion_texto
        )
        VALUES
            (v_metodologia_id, 1, 1, 'CLINICA', 'OPCION_UNICA', 'General', 'Clinica', TRUE, TRUE, 0, NULL, NULL),
            (v_metodologia_id, 2, 2, 'FECHA_INICIO', 'FECHA_HORA', 'General', 'Fecha de entrevista', TRUE, TRUE, 0, NULL, NULL),
            (v_metodologia_id, 3, 3, 'CONSULTA_PARA', 'OPCION_UNICA', 'General', 'La consulta de hoy dia es para Ud. o para otra persona?', TRUE, FALSE, 0, 'Si responde Otra persona, la entrevista termina en esta pregunta.', NULL),
            (v_metodologia_id, 4, 4, 'SERVICIO', 'OPCION_UNICA', 'General', 'A que servicio viene?', TRUE, FALSE, 0, NULL, NULL),
            (v_metodologia_id, 5, 5, 'MIEMBROS_HOGAR', 'OPCION_UNICA', 'Pobreza', 'Cuantos miembros tiene el hogar?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 6, 6, 'JEFE_TRABAJO', 'OPCION_UNICA', 'Pobreza', 'Durante la semana pasada, trabajo el jefe del hogar/esposo al menos una hora?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 7, 7, 'IDIOMA_NINEZ', 'OPCION_UNICA', 'Pobreza', 'Cual es el idioma o lengua que la jefa de hogar/esposa aprendio a hablar en su ninez?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 8, 8, 'CUARTOS', 'OPCION_UNICA', 'Pobreza', 'Cuantos cuartos o habitaciones ocupa su hogar, sin contar bano, cocina, lavanderia, garaje, deposito o negocio?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 9, 9, 'MATERIAL_PISO', 'OPCION_UNICA', 'Pobreza', 'Cual es el material de construccion mas utilizado en los pisos de la vivienda?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 10, 10, 'TIPO_BANO', 'OPCION_UNICA', 'Pobreza', 'Que tipo de bano, servicio sanitario o letrina utilizan normalmente los miembros de su hogar?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 11, 11, 'COMBUSTIBLE', 'OPCION_UNICA', 'Pobreza', 'Principalmente, que tipo de combustible o energia utiliza para cocinar/preparar los alimentos?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 12, 12, 'REFRIGERADOR', 'BOOLEANO', 'Pobreza', 'Tiene, posee o dispone el hogar refrigerador o freezer?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 13, 13, 'TELEVISOR', 'BOOLEANO', 'Pobreza', 'Tiene, posee o dispone el hogar televisor?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 14, 14, 'VEHICULO', 'BOOLEANO', 'Pobreza', 'Tiene, posee o dispone el hogar una motocicleta o un automovil para uso del hogar?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 15, 15, 'IDIOMA_HOGAR', 'OPCION_UNICA', 'Exclusion', 'Que idioma o dialecto hablan normalmente en su hogar? Con que idioma o dialecto normalmente se comunica?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 16, 16, 'EDUCACION', 'OPCION_UNICA', 'Exclusion', 'Cual es el ultimo ano de escolaridad que usted aprobo?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 17, 17, 'METODO_AC', 'BOOLEANO', 'Exclusion', 'Usa algun metodo anticonceptivo moderno? Todos menos los naturales', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 18, 18, 'NO_HABLA_CASTELLANO', 'BOOLEANO', 'Exclusion', 'Hay alguna persona que vive en su hogar que no habla castellano?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 19, 19, 'COMPUTADORA', 'BOOLEANO', 'Exclusion', 'Tiene, posee o dispone su hogar de una computadora?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 20, 20, 'CELULAR', 'BOOLEANO', 'Exclusion', 'Tiene, posee o dispone usted de un celular?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 21, 21, 'LUGAR_PARTO', 'OPCION_UNICA', 'Sub atencion', 'Donde dio usted a luz a su ultimo hijo nacido vivo?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 22, 22, 'ZONA_RESIDENCIA', 'OPCION_UNICA', 'Sub atencion', 'Donde vive usted actualmente: dentro de una ciudad o en una zona rural?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 23, 23, 'ACCESO_SALUD', 'BOOLEANO', 'Sub atencion', 'En los ultimos 12 meses, usted acudio hospital, puesto de salud o clinica de sistema publico de salud para ser atendido/a?', TRUE, FALSE, 1, NULL, NULL),
            (v_metodologia_id, 24, 24, 'SUGERENCIAS', 'TEXTO', 'Final', 'Agradeciendo su atencion, tiene alguna pregunta o sugerencia para nosotros?', FALSE, FALSE, 0, NULL, NULL);

        INSERT INTO cies_instrumento_opcion (pregunta_id, orden, codigo, etiqueta, valor_numerico)
        SELECT pregunta.id, opcion.orden, opcion.codigo, opcion.etiqueta, opcion.valor_numerico
        FROM (
            VALUES
                ('CLINICA', 1, '1', 'Pando', 0),
                ('CLINICA', 2, '2', 'Cochabamba', 0),
                ('CLINICA', 3, '3', 'El Alto', 0),
                ('CLINICA', 4, '4', 'La Paz', 0),
                ('CLINICA', 5, '5', 'Oruro', 0),
                ('CLINICA', 6, '6', 'Potosi', 0),
                ('CLINICA', 7, '7', 'Santa Cruz', 0),
                ('CLINICA', 8, '8', 'Sucre', 0),
                ('CLINICA', 9, '9', 'Tarija', 0),
                ('CLINICA', 10, '10', 'Riberalta', 0),
                ('CONSULTA_PARA', 1, '1', 'Ella misma', 0),
                ('CONSULTA_PARA', 2, '2', 'Otra persona', 0),
                ('SERVICIO', 1, '1', 'Planificacion familiar', 0),
                ('SERVICIO', 2, '2', 'Embarazo/parto', 0),
                ('SERVICIO', 3, '3', 'ITS/VIH', 0),
                ('SERVICIO', 4, '4', 'Ginecologia', 0),
                ('SERVICIO', 5, '5', 'VBG', 0),
                ('SERVICIO', 6, '6', 'Orientacion', 0),
                ('SERVICIO', 7, '7', 'Otro', 0),
                ('MIEMBROS_HOGAR', 1, '1', 'Cinco o mas', 0),
                ('MIEMBROS_HOGAR', 2, '2', 'Cuatro', 9),
                ('MIEMBROS_HOGAR', 3, '3', 'Tres', 14),
                ('MIEMBROS_HOGAR', 4, '4', 'Dos', 20),
                ('MIEMBROS_HOGAR', 5, '5', 'Uno', 23),
                ('JEFE_TRABAJO', 1, '1', 'No', 0),
                ('JEFE_TRABAJO', 2, '2', 'No hay jefe del hogar/esposo', 6),
                ('JEFE_TRABAJO', 3, '3', 'Si', 10),
                ('IDIOMA_NINEZ', 1, '1', 'Un idioma/lengua que no sea el castellano', 0),
                ('IDIOMA_NINEZ', 2, '2', 'Castellano', 6),
                ('IDIOMA_NINEZ', 3, '3', 'No hay jefa del hogar/esposa', 10),
                ('CUARTOS', 1, '1', 'Uno o dos', 0),
                ('CUARTOS', 2, '2', 'Tres', 2),
                ('CUARTOS', 3, '3', 'Cuatro', 5),
                ('CUARTOS', 4, '4', 'Cinco o mas', 7),
                ('MATERIAL_PISO', 1, '1', 'Tierra u otro', 0),
                ('MATERIAL_PISO', 2, '2', 'Ladrillos o cemento', 5),
                ('MATERIAL_PISO', 3, '3', 'Tablon de madera, machimbre, parquet, mosaico, baldosas/ceramica, alfombras o tapices', 11),
                ('TIPO_BANO', 1, '1', 'Ninguno/arbusto/campo', 0),
                ('TIPO_BANO', 2, '2', 'Pozo abierto, letrina, bano ecologico, bano con descarga de agua u otro', 5),
                ('COMBUSTIBLE', 1, '1', 'Lena, grano/bosta, kerosene u otro', 0),
                ('COMBUSTIBLE', 2, '2', 'Gas licuado garrafa', 7),
                ('COMBUSTIBLE', 3, '3', 'Gas natural por red, electricidad o no cocina', 12),
                ('REFRIGERADOR', 1, '1', 'No', 0),
                ('REFRIGERADOR', 2, '2', 'Si', 7),
                ('TELEVISOR', 1, '1', 'No', 0),
                ('TELEVISOR', 2, '2', 'Si', 9),
                ('VEHICULO', 1, '1', 'No', 0),
                ('VEHICULO', 2, '2', 'Si', 6),
                ('IDIOMA_HOGAR', 1, '1', 'Castellano', 6),
                ('IDIOMA_HOGAR', 2, '2', 'Quechua, Aymara, Guarani u otros', 0),
                ('EDUCACION', 1, '1', 'Secundaria completa o mas', 14),
                ('EDUCACION', 2, '2', 'No secundaria', 0),
                ('METODO_AC', 1, '1', 'Si', 14),
                ('METODO_AC', 2, '2', 'No', 0),
                ('NO_HABLA_CASTELLANO', 1, '1', 'No', 0),
                ('NO_HABLA_CASTELLANO', 2, '2', 'Si', 14),
                ('COMPUTADORA', 1, '1', 'Si', 14),
                ('COMPUTADORA', 2, '2', 'No', 0),
                ('CELULAR', 1, '1', 'Si', 14),
                ('CELULAR', 2, '2', 'No', 0),
                ('LUGAR_PARTO', 1, '1', 'Establecimiento de salud hospital, centro de salud, clinica o puesto de salud', 14),
                ('LUGAR_PARTO', 2, '2', 'Su domicilio/partera', 0),
                ('ZONA_RESIDENCIA', 1, '1', 'Ciudad area urbana', 14),
                ('ZONA_RESIDENCIA', 2, '2', 'Periurbana o rural', 0),
                ('ACCESO_SALUD', 1, '1', 'Si', 14),
                ('ACCESO_SALUD', 2, '2', 'No', 0)
        ) AS opcion(codigo_variable, orden, codigo, etiqueta, valor_numerico)
        JOIN cies_instrumento_pregunta pregunta
          ON pregunta.metodologia_id = v_metodologia_id
         AND pregunta.codigo_variable = opcion.codigo_variable;
    END IF;

    UPDATE cies_instrumento_pregunta
    SET ponderacion = 1
    WHERE metodologia_id = v_metodologia_id
      AND metadato = FALSE
      AND codigo_variable <> 'SUGERENCIAS'
      AND (ponderacion IS NULL OR ponderacion = 100);

    IF NOT EXISTS (
        SELECT 1
        FROM cies_instrumento_pregunta
        WHERE metodologia_id = v_metodologia_id
          AND codigo_variable = 'NO_HABLA_CASTELLANO'
    ) THEN
        UPDATE cies_instrumento_pregunta
        SET orden = orden + 1,
            numero_visible = numero_visible + 1
        WHERE metodologia_id = v_metodologia_id
          AND orden >= 18;

        INSERT INTO cies_instrumento_pregunta (
            metodologia_id, orden, numero_visible, codigo_variable, tipo, seccion, etiqueta,
            obligatoria, metadato, ponderacion
        )
        VALUES (
            v_metodologia_id, 18, 18, 'NO_HABLA_CASTELLANO', 'BOOLEANO', 'Exclusion',
            'Hay alguna persona que vive en su hogar que no habla castellano?', TRUE, FALSE, 1
        );
    END IF;

    INSERT INTO cies_instrumento_opcion (pregunta_id, orden, codigo, etiqueta, valor_numerico)
    SELECT p.id, 1, '1', 'No', 0
    FROM cies_instrumento_pregunta p
    WHERE p.metodologia_id = v_metodologia_id
      AND p.codigo_variable = 'NO_HABLA_CASTELLANO'
      AND NOT EXISTS (
          SELECT 1 FROM cies_instrumento_opcion o
          WHERE o.pregunta_id = p.id AND o.codigo = '1'
      );

    INSERT INTO cies_instrumento_opcion (pregunta_id, orden, codigo, etiqueta, valor_numerico)
    SELECT p.id, 2, '2', 'Si', 14
    FROM cies_instrumento_pregunta p
    WHERE p.metodologia_id = v_metodologia_id
      AND p.codigo_variable = 'NO_HABLA_CASTELLANO'
      AND NOT EXISTS (
          SELECT 1 FROM cies_instrumento_opcion o
          WHERE o.pregunta_id = p.id AND o.codigo = '2'
      );

    UPDATE cies_instrumento_opcion o
    SET etiqueta = 'No',
        valor_numerico = 0
    FROM cies_instrumento_pregunta p
    WHERE o.pregunta_id = p.id
      AND p.metodologia_id = v_metodologia_id
      AND p.codigo_variable = 'NO_HABLA_CASTELLANO'
      AND o.codigo = '1';

    UPDATE cies_instrumento_opcion o
    SET etiqueta = 'Si',
        valor_numerico = 14
    FROM cies_instrumento_pregunta p
    WHERE o.pregunta_id = p.id
      AND p.metodologia_id = v_metodologia_id
      AND p.codigo_variable = 'NO_HABLA_CASTELLANO'
      AND o.codigo = '2';
END $$;

COMMIT;
