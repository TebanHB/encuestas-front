package com.encuestas.backend.service;

import com.encuestas.backend.dto.DashboardEmpleadoResponse;
import com.encuestas.backend.model.Encuesta;
import com.encuestas.backend.model.RespuestaEncuesta;
import com.encuestas.backend.model.Usuario;
import com.encuestas.backend.repository.EncuestaRepository;
import com.encuestas.backend.repository.RespuestaEncuestaRepository;
import com.encuestas.backend.repository.UsuarioRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class DashboardEmpleadoService {

    private final EncuestaRepository encuestaRepository;
    private final RespuestaEncuestaRepository respuestaEncuestaRepository;
    private final UsuarioRepository usuarioRepository;

    public DashboardEmpleadoService(
            EncuestaRepository encuestaRepository,
            RespuestaEncuestaRepository respuestaEncuestaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.encuestaRepository = encuestaRepository;
        this.respuestaEncuestaRepository = respuestaEncuestaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public DashboardEmpleadoResponse obtenerDashboardEmpleado(Long usuarioId) {
        if (usuarioId == null) {
            throw new RuntimeException("El usuario es obligatorio");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Encuesta> todasLasEncuestas = encuestaRepository.findAll(
                Sort.by(Sort.Order.desc("fechaCreacion"), Sort.Order.desc("id"))
        );

        List<Encuesta> encuestasAbiertasList = todasLasEncuestas.stream()
                .filter(encuesta -> "OPEN".equals(normalizarEstado(encuesta.getEstado())))
                .toList();

        List<Encuesta> encuestasCerradasList = todasLasEncuestas.stream()
                .filter(encuesta -> "CLOSED".equals(normalizarEstado(encuesta.getEstado())))
                .toList();

        List<RespuestaEncuesta> respuestasEmpleado = respuestaEncuestaRepository
                .findByUsuarioIdOrderByFechaRespuestaDesc(usuarioId);

        Set<Long> encuestasRespondidasIds = new HashSet<>();
        for (RespuestaEncuesta respuesta : respuestasEmpleado) {
            if (respuesta.getEncuesta() != null && respuesta.getEncuesta().getId() != null) {
                encuestasRespondidasIds.add(respuesta.getEncuesta().getId());
            }
        }

        long encuestasAbiertas = encuestasAbiertasList.size();
        long encuestasRespondidas = encuestasRespondidasIds.size();
        long encuestasPendientes = encuestasAbiertasList.stream()
                .filter(encuesta -> !encuestasRespondidasIds.contains(encuesta.getId()))
                .count();
        long encuestasCerradas = encuestasCerradasList.size();

        List<DashboardEmpleadoResponse.EncuestaPendienteItem> encuestasPendientesRecientes = encuestasAbiertasList.stream()
                .filter(encuesta -> !encuestasRespondidasIds.contains(encuesta.getId()))
                .limit(5)
                .map(encuesta -> new DashboardEmpleadoResponse.EncuestaPendienteItem(
                        encuesta.getId(),
                        encuesta.getTitulo(),
                        encuesta.getDescripcion(),
                        encuesta.getModoCalificable(),
                        encuesta.getFechaCreacion()
                ))
                .toList();

        List<DashboardEmpleadoResponse.RespuestaEmpleadoItem> respuestasRecientes = respuestasEmpleado.stream()
                .limit(5)
                .map(respuesta -> new DashboardEmpleadoResponse.RespuestaEmpleadoItem(
                        respuesta.getId(),
                        respuesta.getEncuesta().getTitulo(),
                        respuesta.getFechaRespuesta()
                ))
                .toList();

        return new DashboardEmpleadoResponse(
                construirNombreCompleto(usuario),
                usuario.getEmail(),
                encuestasAbiertas,
                encuestasRespondidas,
                encuestasPendientes,
                encuestasCerradas,
                encuestasPendientesRecientes,
                respuestasRecientes
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

    private String construirNombreCompleto(Usuario usuario) {
        String nombre = usuario.getNombre() != null ? usuario.getNombre().trim() : "";
        String apellido = usuario.getApellido() != null ? usuario.getApellido().trim() : "";
        return (nombre + " " + apellido).trim();
    }
}