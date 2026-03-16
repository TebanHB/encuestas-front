package com.encuestas.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DashboardAdminResponse {

    private long totalEncuestas;
    private long encuestasBorrador;
    private long encuestasAbiertas;
    private long encuestasCerradas;
    private long totalRespuestas;
    private long totalEmpleados;
    private List<EncuestaReciente> encuestasRecientes;
    private List<RespuestaReciente> respuestasRecientes;

    public DashboardAdminResponse() {
    }

    public DashboardAdminResponse(
            long totalEncuestas,
            long encuestasBorrador,
            long encuestasAbiertas,
            long encuestasCerradas,
            long totalRespuestas,
            long totalEmpleados,
            List<EncuestaReciente> encuestasRecientes,
            List<RespuestaReciente> respuestasRecientes
    ) {
        this.totalEncuestas = totalEncuestas;
        this.encuestasBorrador = encuestasBorrador;
        this.encuestasAbiertas = encuestasAbiertas;
        this.encuestasCerradas = encuestasCerradas;
        this.totalRespuestas = totalRespuestas;
        this.totalEmpleados = totalEmpleados;
        this.encuestasRecientes = encuestasRecientes;
        this.respuestasRecientes = respuestasRecientes;
    }

    public long getTotalEncuestas() {
        return totalEncuestas;
    }

    public long getEncuestasBorrador() {
        return encuestasBorrador;
    }

    public long getEncuestasAbiertas() {
        return encuestasAbiertas;
    }

    public long getEncuestasCerradas() {
        return encuestasCerradas;
    }

    public long getTotalRespuestas() {
        return totalRespuestas;
    }

    public long getTotalEmpleados() {
        return totalEmpleados;
    }

    public List<EncuestaReciente> getEncuestasRecientes() {
        return encuestasRecientes;
    }

    public List<RespuestaReciente> getRespuestasRecientes() {
        return respuestasRecientes;
    }

    public static class EncuestaReciente {
        private Long id;
        private String titulo;
        private String estado;
        private Boolean modoCalificable;
        private LocalDateTime fechaCreacion;

        public EncuestaReciente() {
        }

        public EncuestaReciente(Long id, String titulo, String estado, Boolean modoCalificable, LocalDateTime fechaCreacion) {
            this.id = id;
            this.titulo = titulo;
            this.estado = estado;
            this.modoCalificable = modoCalificable;
            this.fechaCreacion = fechaCreacion;
        }

        public Long getId() {
            return id;
        }

        public String getTitulo() {
            return titulo;
        }

        public String getEstado() {
            return estado;
        }

        public Boolean getModoCalificable() {
            return modoCalificable;
        }

        public LocalDateTime getFechaCreacion() {
            return fechaCreacion;
        }
    }

    public static class RespuestaReciente {
        private Long idRespuesta;
        private String participante;
        private String correo;
        private String encuestaTitulo;
        private Integer puntaje;
        private LocalDateTime fechaRespuesta;

        public RespuestaReciente() {
        }

        public RespuestaReciente(
                Long idRespuesta,
                String participante,
                String correo,
                String encuestaTitulo,
                Integer puntaje,
                LocalDateTime fechaRespuesta
        ) {
            this.idRespuesta = idRespuesta;
            this.participante = participante;
            this.correo = correo;
            this.encuestaTitulo = encuestaTitulo;
            this.puntaje = puntaje;
            this.fechaRespuesta = fechaRespuesta;
        }

        public Long getIdRespuesta() {
            return idRespuesta;
        }

        public String getParticipante() {
            return participante;
        }

        public String getCorreo() {
            return correo;
        }

        public String getEncuestaTitulo() {
            return encuestaTitulo;
        }

        public Integer getPuntaje() {
            return puntaje;
        }

        public LocalDateTime getFechaRespuesta() {
            return fechaRespuesta;
        }
    }
}