package com.encuestas.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DashboardEmpleadoResponse {

    private String nombreEmpleado;
    private String correoEmpleado;
    private long encuestasAbiertas;
    private long encuestasRespondidas;
    private long encuestasPendientes;
    private long encuestasCerradas;
    private List<EncuestaPendienteItem> encuestasPendientesRecientes;
    private List<RespuestaEmpleadoItem> respuestasRecientes;

    public DashboardEmpleadoResponse() {
    }

    public DashboardEmpleadoResponse(
            String nombreEmpleado,
            String correoEmpleado,
            long encuestasAbiertas,
            long encuestasRespondidas,
            long encuestasPendientes,
            long encuestasCerradas,
            List<EncuestaPendienteItem> encuestasPendientesRecientes,
            List<RespuestaEmpleadoItem> respuestasRecientes
    ) {
        this.nombreEmpleado = nombreEmpleado;
        this.correoEmpleado = correoEmpleado;
        this.encuestasAbiertas = encuestasAbiertas;
        this.encuestasRespondidas = encuestasRespondidas;
        this.encuestasPendientes = encuestasPendientes;
        this.encuestasCerradas = encuestasCerradas;
        this.encuestasPendientesRecientes = encuestasPendientesRecientes;
        this.respuestasRecientes = respuestasRecientes;
    }

    public String getNombreEmpleado() {
        return nombreEmpleado;
    }

    public String getCorreoEmpleado() {
        return correoEmpleado;
    }

    public long getEncuestasAbiertas() {
        return encuestasAbiertas;
    }

    public long getEncuestasRespondidas() {
        return encuestasRespondidas;
    }

    public long getEncuestasPendientes() {
        return encuestasPendientes;
    }

    public long getEncuestasCerradas() {
        return encuestasCerradas;
    }

    public List<EncuestaPendienteItem> getEncuestasPendientesRecientes() {
        return encuestasPendientesRecientes;
    }

    public List<RespuestaEmpleadoItem> getRespuestasRecientes() {
        return respuestasRecientes;
    }

    public static class EncuestaPendienteItem {
        private Long id;
        private String titulo;
        private String descripcion;
        private Boolean modoCalificable;
        private LocalDateTime fechaCreacion;

        public EncuestaPendienteItem() {
        }

        public EncuestaPendienteItem(Long id, String titulo, String descripcion, Boolean modoCalificable, LocalDateTime fechaCreacion) {
            this.id = id;
            this.titulo = titulo;
            this.descripcion = descripcion;
            this.modoCalificable = modoCalificable;
            this.fechaCreacion = fechaCreacion;
        }

        public Long getId() {
            return id;
        }

        public String getTitulo() {
            return titulo;
        }

        public String getDescripcion() {
            return descripcion;
        }

        public Boolean getModoCalificable() {
            return modoCalificable;
        }

        public LocalDateTime getFechaCreacion() {
            return fechaCreacion;
        }
    }

    public static class RespuestaEmpleadoItem {
        private Long idRespuesta;
        private String encuestaTitulo;
        private LocalDateTime fechaRespuesta;

        public RespuestaEmpleadoItem() {
        }

        public RespuestaEmpleadoItem(Long idRespuesta, String encuestaTitulo, LocalDateTime fechaRespuesta) {
            this.idRespuesta = idRespuesta;
            this.encuestaTitulo = encuestaTitulo;
            this.fechaRespuesta = fechaRespuesta;
        }

        public Long getIdRespuesta() {
            return idRespuesta;
        }

        public String getEncuestaTitulo() {
            return encuestaTitulo;
        }

        public LocalDateTime getFechaRespuesta() {
            return fechaRespuesta;
        }
    }
}