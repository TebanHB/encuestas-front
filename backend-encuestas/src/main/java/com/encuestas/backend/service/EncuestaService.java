package com.encuestas.backend.service;

import com.encuestas.backend.dto.CambiarEstadoEncuestaRequest;
import com.encuestas.backend.dto.EncuestaDetalleResponse;
import com.encuestas.backend.dto.EncuestaResponse;
import com.encuestas.backend.dto.GuardarEncuestaRequest;
import com.encuestas.backend.model.Encuesta;
import com.encuestas.backend.model.OpcionPregunta;
import com.encuestas.backend.model.Pregunta;
import com.encuestas.backend.model.Usuario;
import com.encuestas.backend.repository.EncuestaRepository;
import com.encuestas.backend.repository.RespuestaEncuestaRepository;
import com.encuestas.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

@Service
public class EncuestaService {

    private final EncuestaRepository encuestaRepository;
    private final RespuestaEncuestaRepository respuestaEncuestaRepository;
    private final UsuarioRepository usuarioRepository;

    public EncuestaService(
            EncuestaRepository encuestaRepository,
            RespuestaEncuestaRepository respuestaEncuestaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.encuestaRepository = encuestaRepository;
        this.respuestaEncuestaRepository = respuestaEncuestaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<EncuestaResponse> listarEncuestas() {
        return encuestaRepository.findAllByOrderByFechaCreacionDesc().stream()
                .map(this::mapearEncuestaResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EncuestaResponse> listarEncuestasDisponiblesParaEmpleado(String correo) {
        if (correo == null || correo.trim().isEmpty()) {
            throw new RuntimeException("El correo del empleado es obligatorio");
        }

        Usuario usuario = usuarioRepository.findByEmail(correo.trim())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Encuesta> encuestasAbiertas = encuestaRepository.findByEstadoOrderByFechaCreacionDesc("OPEN");
        List<Encuesta> encuestasAbiertasTexto = encuestaRepository.findByEstadoOrderByFechaCreacionDesc("ABIERTA");

        Set<Long> idsRespondidas = new HashSet<>();
        respuestaEncuestaRepository.findByUsuarioId(usuario.getId())
                .forEach(respuesta -> {
                    if (respuesta.getEncuesta() != null && respuesta.getEncuesta().getId() != null) {
                        idsRespondidas.add(respuesta.getEncuesta().getId());
                    }
                });

        return Stream.concat(encuestasAbiertas.stream(), encuestasAbiertasTexto.stream())
                .filter(encuesta -> encuesta.getId() != null && !idsRespondidas.contains(encuesta.getId()))
                .distinct()
                .sorted((a, b) -> {
                    if (a.getFechaCreacion() == null && b.getFechaCreacion() == null) return 0;
                    if (a.getFechaCreacion() == null) return 1;
                    if (b.getFechaCreacion() == null) return -1;
                    return b.getFechaCreacion().compareTo(a.getFechaCreacion());
                })
                .map(this::mapearEncuestaResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EncuestaDetalleResponse obtenerDetalleEncuesta(Long id) {
        Encuesta encuesta = encuestaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        return new EncuestaDetalleResponse(
                encuesta.getId(),
                encuesta.getTitulo(),
                encuesta.getDescripcion(),
                normalizarEstado(encuesta.getEstado()),
                encuesta.getModoCalificable(),
                encuesta.getFechaCreacion(),
                encuesta.getPreguntas().stream()
                        .sorted((a, b) -> compararOrden(a.getOrden(), b.getOrden(), a.getId(), b.getId()))
                        .map(pregunta ->
                                new EncuestaDetalleResponse.PreguntaDetalleResponse(
                                        pregunta.getId(),
                                        pregunta.getTitulo(),
                                        pregunta.getTipo(),
                                        pregunta.getObligatoria(),
                                        pregunta.getOrden(),
                                        pregunta.getFormatoNumeracion(),
                                        pregunta.getFormatoOpciones(),
                                        pregunta.getOpciones().stream()
                                                .sorted((a, b) -> compararOrden(a.getOrden(), b.getOrden(), a.getId(), b.getId()))
                                                .map(opcion ->
                                                        new EncuestaDetalleResponse.OpcionDetalleResponse(
                                                                opcion.getId(),
                                                                opcion.getTexto(),
                                                                opcion.getCorrecta(),
                                                                opcion.getOrden()
                                                        )
                                                ).toList()
                                )
                        ).toList()
        );
    }

    @Transactional
    public EncuestaResponse guardarEncuesta(GuardarEncuestaRequest request) {
        Encuesta encuesta = new Encuesta();
        encuesta.setTitulo(request.getTitulo().trim());
        encuesta.setDescripcion(request.getDescripcion() != null ? request.getDescripcion().trim() : null);
        encuesta.setEstado("DRAFT");
        encuesta.setModoCalificable(request.getModoCalificable());
        encuesta.setFechaCreacion(LocalDateTime.now());

        construirPreguntas(request, encuesta);

        Encuesta guardada = encuestaRepository.save(encuesta);
        return mapearEncuestaResponse(guardada);
    }

    @Transactional
    public EncuestaResponse actualizarEncuesta(Long id, GuardarEncuestaRequest request) {
        Encuesta encuesta = encuestaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        String estado = normalizarEstado(encuesta.getEstado());
        if (!"DRAFT".equals(estado)) {
            throw new RuntimeException("Solo se pueden editar encuestas en estado Borrador");
        }

        encuesta.getPreguntas().clear();
        encuesta.setTitulo(request.getTitulo().trim());
        encuesta.setDescripcion(request.getDescripcion() != null ? request.getDescripcion().trim() : null);
        encuesta.setModoCalificable(request.getModoCalificable());

        construirPreguntas(request, encuesta);

        Encuesta actualizada = encuestaRepository.save(encuesta);
        return mapearEncuestaResponse(actualizada);
    }

    @Transactional
    public EncuestaResponse cambiarEstado(Long id, CambiarEstadoEncuestaRequest request) {
        Encuesta encuesta = encuestaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        String nuevoEstado = request.getEstado() != null ? request.getEstado().trim().toUpperCase() : "";
        if (!"DRAFT".equals(nuevoEstado) && !"OPEN".equals(nuevoEstado) && !"CLOSED".equals(nuevoEstado)) {
            throw new RuntimeException("Estado inválido");
        }

        encuesta.setEstado(nuevoEstado);
        Encuesta actualizada = encuestaRepository.save(encuesta);

        return mapearEncuestaResponse(actualizada);
    }

    @Transactional
    public void eliminarEncuesta(Long id) {
        Encuesta encuesta = encuestaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        if (respuestaEncuestaRepository.existsByEncuestaId(id)) {
            throw new RuntimeException("No se puede eliminar una encuesta que ya tiene respuestas");
        }

        encuestaRepository.delete(encuesta);
    }

    @Transactional(readOnly = true)
    public void validarPuedeEditar(Long id) {
        Encuesta encuesta = encuestaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        String estado = normalizarEstado(encuesta.getEstado());
        if (!"DRAFT".equals(estado)) {
            throw new RuntimeException("Solo las encuestas en Borrador se pueden editar");
        }
    }

    @Transactional(readOnly = true)
    public void validarPuedeExportar(Long id) {
        Encuesta encuesta = encuestaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        String estado = normalizarEstado(encuesta.getEstado());
        if (!"OPEN".equals(estado) && !"CLOSED".equals(estado)) {
            throw new RuntimeException("Solo las encuestas Abiertas o Cerradas se pueden exportar");
        }
    }

    private void construirPreguntas(GuardarEncuestaRequest request, Encuesta encuesta) {
        if (request.getPreguntas() == null || request.getPreguntas().isEmpty()) {
            throw new RuntimeException("Debes agregar al menos una pregunta");
        }

        int indicePregunta = 0;

        for (GuardarEncuestaRequest.PreguntaRequest preguntaRequest : request.getPreguntas()) {
            String tipo = normalizarTipoPregunta(preguntaRequest.getTipo());

            Pregunta pregunta = new Pregunta();
            pregunta.setTitulo(preguntaRequest.getTitulo().trim());
            pregunta.setTipo(tipo);
            pregunta.setObligatoria(Boolean.TRUE.equals(preguntaRequest.getObligatoria()));
            pregunta.setOrden(preguntaRequest.getOrden() != null ? preguntaRequest.getOrden() : indicePregunta);
            pregunta.setFormatoNumeracion(normalizarFormatoNumeracion(preguntaRequest.getFormatoNumeracion()));
            pregunta.setFormatoOpciones(normalizarFormatoOpciones(preguntaRequest.getFormatoOpciones()));
            pregunta.setEncuesta(encuesta);

            if (requiereOpciones(tipo)) {
                List<GuardarEncuestaRequest.OpcionRequest> opcionesRequest = preguntaRequest.getOpciones();

                if ("SI_NO".equals(tipo) && (opcionesRequest == null || opcionesRequest.isEmpty())) {
                    opcionesRequest = List.of(
                            crearOpcionFija("Sí", false, 0),
                            crearOpcionFija("No", false, 1)
                    );
                }

                if (opcionesRequest == null || opcionesRequest.isEmpty()) {
                    throw new RuntimeException("Las preguntas de opción deben tener opciones");
                }

                int indiceOpcion = 0;

                for (GuardarEncuestaRequest.OpcionRequest opcionRequest : opcionesRequest) {
                    OpcionPregunta opcion = new OpcionPregunta();
                    opcion.setTexto(opcionRequest.getTexto().trim());
                    opcion.setCorrecta(Boolean.TRUE.equals(opcionRequest.getCorrecta()));
                    opcion.setOrden(opcionRequest.getOrden() != null ? opcionRequest.getOrden() : indiceOpcion);
                    opcion.setPregunta(pregunta);
                    pregunta.getOpciones().add(opcion);
                    indiceOpcion++;
                }
            }

            encuesta.getPreguntas().add(pregunta);
            indicePregunta++;
        }
    }

    private GuardarEncuestaRequest.OpcionRequest crearOpcionFija(String texto, boolean correcta, int orden) {
        GuardarEncuestaRequest.OpcionRequest opcion = new GuardarEncuestaRequest.OpcionRequest();
        opcion.setTexto(texto);
        opcion.setCorrecta(correcta);
        opcion.setOrden(orden);
        return opcion;
    }

    private EncuestaResponse mapearEncuestaResponse(Encuesta encuesta) {
        return new EncuestaResponse(
                encuesta.getId(),
                encuesta.getTitulo(),
                encuesta.getDescripcion(),
                normalizarEstado(encuesta.getEstado()),
                encuesta.getModoCalificable(),
                encuesta.getFechaCreacion(),
                encuesta.getPreguntas() != null ? encuesta.getPreguntas().size() : 0
        );
    }

    private boolean requiereOpciones(String tipo) {
        return "OPCION_UNICA".equals(tipo) || "OPCION_MULTIPLE".equals(tipo) || "SI_NO".equals(tipo);
    }

    private String normalizarTipoPregunta(String tipo) {
        String valor = tipo == null ? "" : tipo.trim().toUpperCase();

        return switch (valor) {
            case "TEXTO", "TEXTO_CORTO" -> "TEXTO_CORTO";
            case "TEXTO_LARGO" -> "TEXTO_LARGO";
            case "OPCION_UNICA" -> "OPCION_UNICA";
            case "OPCION_MULTIPLE" -> "OPCION_MULTIPLE";
            case "SI_NO" -> "SI_NO";
            case "COMPLETAR_ORACION" -> "COMPLETAR_ORACION";
            case "NUMERICA" -> "NUMERICA";
            default -> throw new RuntimeException("Tipo de pregunta inválido: " + tipo);
        };
    }

    private String normalizarFormatoNumeracion(String formato) {
        String valor = formato == null ? "" : formato.trim().toUpperCase();

        return switch (valor) {
            case "", "NINGUNA" -> "NINGUNA";
            case "NUMERO_PARENTESIS" -> "NUMERO_PARENTESIS";
            case "NUMERO_GUION" -> "NUMERO_GUION";
            case "LETRA_PARENTESIS" -> "LETRA_PARENTESIS";
            case "LETRA_PUNTO" -> "LETRA_PUNTO";
            default -> "NUMERO_PARENTESIS";
        };
    }

    private String normalizarFormatoOpciones(String formato) {
        String valor = formato == null ? "" : formato.trim().toUpperCase();

        return switch (valor) {
            case "", "SIN_PREFIJO" -> "SIN_PREFIJO";
            case "NUMERO_PARENTESIS" -> "NUMERO_PARENTESIS";
            case "NUMERO_GUION" -> "NUMERO_GUION";
            case "LETRA_PARENTESIS" -> "LETRA_PARENTESIS";
            case "LETRA_PUNTO" -> "LETRA_PUNTO";
            default -> "SIN_PREFIJO";
        };
    }

    private String normalizarEstado(String estado) {
        String valor = estado == null ? "" : estado.trim().toUpperCase();

        if ("BORRADOR".equals(valor)) {
            return "DRAFT";
        }
        if ("ABIERTA".equals(valor)) {
            return "OPEN";
        }
        if ("CERRADA".equals(valor)) {
            return "CLOSED";
        }

        return valor;
    }

    private int compararOrden(Integer ordenA, Integer ordenB, Long idA, Long idB) {
        int a = ordenA != null ? ordenA : Integer.MAX_VALUE;
        int b = ordenB != null ? ordenB : Integer.MAX_VALUE;

        if (a != b) {
            return Integer.compare(a, b);
        }

        long ida = idA != null ? idA : Long.MAX_VALUE;
        long idb = idB != null ? idB : Long.MAX_VALUE;
        return Long.compare(ida, idb);
    }
}