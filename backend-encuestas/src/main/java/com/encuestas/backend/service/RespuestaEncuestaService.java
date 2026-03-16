package com.encuestas.backend.service;

import com.encuestas.backend.dto.GuardarRespuestaRequest;
import com.encuestas.backend.dto.RespuestaEncuestaResponse;
import com.encuestas.backend.model.Encuesta;
import com.encuestas.backend.model.OpcionPregunta;
import com.encuestas.backend.model.Pregunta;
import com.encuestas.backend.model.RespuestaEncuesta;
import com.encuestas.backend.model.RespuestaOpcion;
import com.encuestas.backend.model.RespuestaPregunta;
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
import java.util.stream.Collectors;

@Service
public class RespuestaEncuestaService {

    private final EncuestaRepository encuestaRepository;
    private final RespuestaEncuestaRepository respuestaEncuestaRepository;
    private final UsuarioRepository usuarioRepository;

    public RespuestaEncuestaService(
            EncuestaRepository encuestaRepository,
            RespuestaEncuestaRepository respuestaEncuestaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.encuestaRepository = encuestaRepository;
        this.respuestaEncuestaRepository = respuestaEncuestaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public RespuestaEncuestaResponse guardarRespuesta(GuardarRespuestaRequest request) {
        Encuesta encuesta = encuestaRepository.findById(request.getEncuestaId())
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String estado = normalizarEstado(encuesta.getEstado());
        if (!"OPEN".equals(estado)) {
            throw new RuntimeException("Solo las encuestas Abiertas pueden responderse");
        }

        boolean yaRespondio = respuestaEncuestaRepository.existsByEncuestaIdAndUsuarioId(
                encuesta.getId(),
                usuario.getId()
        );

        if (yaRespondio) {
            throw new RuntimeException("Ya respondiste esta encuesta");
        }

        RespuestaEncuesta respuestaEncuesta = new RespuestaEncuesta();
        respuestaEncuesta.setEncuesta(encuesta);
        respuestaEncuesta.setUsuario(usuario);
        respuestaEncuesta.setNombreParticipante(construirNombreCompleto(usuario));
        respuestaEncuesta.setCorreoParticipante(usuario.getEmail());
        respuestaEncuesta.setFechaRespuesta(LocalDateTime.now());

        int puntaje = 0;

        for (GuardarRespuestaRequest.RespuestaPreguntaRequest respuestaRequest : request.getRespuestas()) {
            Pregunta pregunta = encuesta.getPreguntas().stream()
                    .filter(p -> p.getId().equals(respuestaRequest.getPreguntaId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("La pregunta " + respuestaRequest.getPreguntaId() + " no pertenece a la encuesta"));

            RespuestaPregunta respuestaPregunta = new RespuestaPregunta();
            respuestaPregunta.setRespuestaEncuesta(respuestaEncuesta);
            respuestaPregunta.setPregunta(pregunta);

            if (esPreguntaTexto(pregunta.getTipo())) {
                String texto = respuestaRequest.getTextoRespuesta() != null ? respuestaRequest.getTextoRespuesta().trim() : "";

                if (Boolean.TRUE.equals(pregunta.getObligatoria()) && texto.isEmpty()) {
                    throw new RuntimeException("Debes responder la pregunta: " + pregunta.getTitulo());
                }

                if ("NUMERICA".equalsIgnoreCase(pregunta.getTipo()) && !texto.isEmpty()) {
                    try {
                        Double.parseDouble(texto);
                    } catch (NumberFormatException e) {
                        throw new RuntimeException("La pregunta debe tener un valor numérico: " + pregunta.getTitulo());
                    }
                }

                respuestaPregunta.setTextoRespuesta(texto);

                boolean correctaTexto = !Boolean.TRUE.equals(encuesta.getModoCalificable());
                respuestaPregunta.setCorrecta(correctaTexto);

                if (correctaTexto && Boolean.TRUE.equals(encuesta.getModoCalificable())) {
                    puntaje++;
                }
            } else if (esPreguntaOpciones(pregunta.getTipo())) {
                List<Long> opcionIds = respuestaRequest.getOpcionIds() != null
                        ? respuestaRequest.getOpcionIds()
                        : List.of();

                if (Boolean.TRUE.equals(pregunta.getObligatoria()) && opcionIds.isEmpty()) {
                    if ("OPCION_MULTIPLE".equalsIgnoreCase(pregunta.getTipo())) {
                        throw new RuntimeException("Debes seleccionar al menos una opción para la pregunta: " + pregunta.getTitulo());
                    } else {
                        throw new RuntimeException("Debes seleccionar una opción para la pregunta: " + pregunta.getTitulo());
                    }
                }

                Set<Long> seleccionadas = new HashSet<>(opcionIds);
                Set<Long> correctas = pregunta.getOpciones().stream()
                        .filter(OpcionPregunta::getCorrecta)
                        .map(OpcionPregunta::getId)
                        .collect(Collectors.toSet());

                for (Long opcionId : seleccionadas) {
                    OpcionPregunta opcion = pregunta.getOpciones().stream()
                            .filter(o -> o.getId().equals(opcionId))
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("La opción " + opcionId + " no pertenece a la pregunta " + pregunta.getTitulo()));

                    RespuestaOpcion respuestaOpcion = new RespuestaOpcion();
                    respuestaOpcion.setRespuestaPregunta(respuestaPregunta);
                    respuestaOpcion.setOpcionPregunta(opcion);
                    respuestaPregunta.getRespuestasOpcion().add(respuestaOpcion);
                }

                boolean correcta = !Boolean.TRUE.equals(encuesta.getModoCalificable()) || seleccionadas.equals(correctas);
                respuestaPregunta.setCorrecta(correcta);

                if (correcta && Boolean.TRUE.equals(encuesta.getModoCalificable())) {
                    puntaje++;
                }
            } else {
                throw new RuntimeException("Tipo de pregunta no soportado: " + pregunta.getTipo());
            }

            respuestaEncuesta.getRespuestasPregunta().add(respuestaPregunta);
        }

        respuestaEncuesta.setPuntaje(Boolean.TRUE.equals(encuesta.getModoCalificable()) ? puntaje : 0);

        RespuestaEncuesta guardada = respuestaEncuestaRepository.save(respuestaEncuesta);

        return new RespuestaEncuestaResponse(
                guardada.getId(),
                encuesta.getId(),
                encuesta.getTitulo(),
                guardada.getNombreParticipante(),
                guardada.getCorreoParticipante(),
                guardada.getPuntaje(),
                guardada.getFechaRespuesta()
        );
    }

    private boolean esPreguntaTexto(String tipo) {
        if (tipo == null) {
            return false;
        }

        String valor = tipo.trim().toUpperCase();

        return "TEXTO".equals(valor)
                || "TEXTO_CORTO".equals(valor)
                || "TEXTO_LARGO".equals(valor)
                || "COMPLETAR_ORACION".equals(valor)
                || "NUMERICA".equals(valor);
    }

    private boolean esPreguntaOpciones(String tipo) {
        if (tipo == null) {
            return false;
        }

        String valor = tipo.trim().toUpperCase();

        return "OPCION_UNICA".equals(valor)
                || "OPCION_MULTIPLE".equals(valor)
                || "SI_NO".equals(valor);
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

    private String construirNombreCompleto(Usuario usuario) {
        String nombre = usuario.getNombre() != null ? usuario.getNombre().trim() : "";
        String apellido = usuario.getApellido() != null ? usuario.getApellido().trim() : "";
        return (nombre + " " + apellido).trim();
    }
}