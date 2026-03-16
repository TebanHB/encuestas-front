package com.encuestas.backend.service;

import com.encuestas.backend.dto.RespuestaEncuestaDetalleAdminResponse;
import com.encuestas.backend.dto.ResultadoEncuestaAdminResponse;
import com.encuestas.backend.model.Encuesta;
import com.encuestas.backend.model.RespuestaEncuesta;
import com.encuestas.backend.repository.EncuestaRepository;
import com.encuestas.backend.repository.RespuestaEncuestaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResultadoAdminService {

    private final EncuestaRepository encuestaRepository;
    private final RespuestaEncuestaRepository respuestaEncuestaRepository;

    public ResultadoAdminService(
            EncuestaRepository encuestaRepository,
            RespuestaEncuestaRepository respuestaEncuestaRepository
    ) {
        this.encuestaRepository = encuestaRepository;
        this.respuestaEncuestaRepository = respuestaEncuestaRepository;
    }

    @Transactional(readOnly = true)
    public List<ResultadoEncuestaAdminResponse> listarEncuestasConResultados() {
        List<Encuesta> encuestas = encuestaRepository.findAll(
                Sort.by(Sort.Order.desc("fechaCreacion"), Sort.Order.desc("id"))
        );

        return encuestas.stream()
                .map(encuesta -> new ResultadoEncuestaAdminResponse(
                        encuesta.getId(),
                        encuesta.getTitulo(),
                        encuesta.getDescripcion(),
                        normalizarEstado(encuesta.getEstado()),
                        encuesta.getModoCalificable(),
                        encuesta.getPreguntas() != null ? encuesta.getPreguntas().size() : 0,
                        respuestaEncuestaRepository.countByEncuestaId(encuesta.getId()),
                        encuesta.getFechaCreacion()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RespuestaEncuestaDetalleAdminResponse> listarRespuestasPorEncuesta(Long encuestaId) {
        Encuesta encuesta = encuestaRepository.findById(encuestaId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        List<RespuestaEncuesta> respuestas = respuestaEncuestaRepository.findByEncuestaIdOrderByFechaRespuestaDesc(encuesta.getId());

        return respuestas.stream()
                .map(respuesta -> new RespuestaEncuestaDetalleAdminResponse(
                        respuesta.getId(),
                        respuesta.getNombreParticipante(),
                        respuesta.getCorreoParticipante(),
                        respuesta.getPuntaje(),
                        respuesta.getFechaRespuesta(),
                        respuesta.getRespuestasPregunta().stream()
                                .map(rp -> new RespuestaEncuestaDetalleAdminResponse.RespuestaPreguntaDetalle(
                                        rp.getPregunta().getTitulo(),
                                        rp.getPregunta().getTipo(),
                                        rp.getTextoRespuesta(),
                                        rp.getRespuestasOpcion().stream()
                                                .map(ro -> ro.getOpcionPregunta().getTexto())
                                                .toList(),
                                        rp.getCorrecta()
                                ))
                                .toList()
                ))
                .toList();
    }

    @Transactional
    public void eliminarRespuesta(Long respuestaId) {
        RespuestaEncuesta respuesta = respuestaEncuestaRepository.findById(respuestaId)
                .orElseThrow(() -> new RuntimeException("Respuesta no encontrada"));

        respuestaEncuestaRepository.delete(respuesta);
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
}