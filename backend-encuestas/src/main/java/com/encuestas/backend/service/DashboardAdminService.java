package com.encuestas.backend.service;

import com.encuestas.backend.dto.DashboardAdminResponse;
import com.encuestas.backend.model.Encuesta;
import com.encuestas.backend.model.RespuestaEncuesta;
import com.encuestas.backend.repository.EncuestaRepository;
import com.encuestas.backend.repository.RespuestaEncuestaRepository;
import com.encuestas.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DashboardAdminService {

    private final EncuestaRepository encuestaRepository;
    private final RespuestaEncuestaRepository respuestaEncuestaRepository;
    private final UsuarioRepository usuarioRepository;

    public DashboardAdminService(
            EncuestaRepository encuestaRepository,
            RespuestaEncuestaRepository respuestaEncuestaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.encuestaRepository = encuestaRepository;
        this.respuestaEncuestaRepository = respuestaEncuestaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public DashboardAdminResponse obtenerDashboardAdmin() {
        long totalEncuestas = encuestaRepository.count();
        long encuestasBorrador = encuestaRepository.countByEstado("DRAFT") + encuestaRepository.countByEstado("BORRADOR");
        long encuestasAbiertas = encuestaRepository.countByEstado("OPEN") + encuestaRepository.countByEstado("ABIERTA");
        long encuestasCerradas = encuestaRepository.countByEstado("CLOSED") + encuestaRepository.countByEstado("CERRADA");
        long totalRespuestas = respuestaEncuestaRepository.count();
        long totalEmpleados = usuarioRepository.count();

        List<DashboardAdminResponse.EncuestaReciente> encuestasRecientes = encuestaRepository.findTop5ByOrderByFechaCreacionDesc()
                .stream()
                .map(this::mapearEncuestaReciente)
                .toList();

        List<DashboardAdminResponse.RespuestaReciente> respuestasRecientes = respuestaEncuestaRepository.findTop5ByOrderByFechaRespuestaDesc()
                .stream()
                .map(this::mapearRespuestaReciente)
                .toList();

        return new DashboardAdminResponse(
                totalEncuestas,
                encuestasBorrador,
                encuestasAbiertas,
                encuestasCerradas,
                totalRespuestas,
                totalEmpleados,
                encuestasRecientes,
                respuestasRecientes
        );
    }

    private DashboardAdminResponse.EncuestaReciente mapearEncuestaReciente(Encuesta encuesta) {
        return new DashboardAdminResponse.EncuestaReciente(
                encuesta.getId(),
                encuesta.getTitulo(),
                normalizarEstado(encuesta.getEstado()),
                encuesta.getModoCalificable(),
                encuesta.getFechaCreacion()
        );
    }

    private DashboardAdminResponse.RespuestaReciente mapearRespuestaReciente(RespuestaEncuesta respuesta) {
        return new DashboardAdminResponse.RespuestaReciente(
                respuesta.getId(),
                respuesta.getNombreParticipante(),
                respuesta.getCorreoParticipante(),
                respuesta.getEncuesta().getTitulo(),
                respuesta.getPuntaje(),
                respuesta.getFechaRespuesta()
        );
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