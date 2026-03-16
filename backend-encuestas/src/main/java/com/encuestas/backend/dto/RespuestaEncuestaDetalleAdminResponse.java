package com.encuestas.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class RespuestaEncuestaDetalleAdminResponse {

    private Long idRespuesta;
    private String nombreParticipante;
    private String correoParticipante;
    private Integer puntaje;
    private LocalDateTime fechaRespuesta;
    private List<RespuestaPreguntaDetalle> respuestas;

    public RespuestaEncuestaDetalleAdminResponse() {
    }

    public RespuestaEncuestaDetalleAdminResponse(
            Long idRespuesta,
            String nombreParticipante,
            String correoParticipante,
            Integer puntaje,
            LocalDateTime fechaRespuesta,
            List<RespuestaPreguntaDetalle> respuestas
    ) {
        this.idRespuesta = idRespuesta;
        this.nombreParticipante = nombreParticipante;
        this.correoParticipante = correoParticipante;
        this.puntaje = puntaje;
        this.fechaRespuesta = fechaRespuesta;
        this.respuestas = respuestas;
    }

    public Long getIdRespuesta() {
        return idRespuesta;
    }

    public String getNombreParticipante() {
        return nombreParticipante;
    }

    public String getCorreoParticipante() {
        return correoParticipante;
    }

    public Integer getPuntaje() {
        return puntaje;
    }

    public LocalDateTime getFechaRespuesta() {
        return fechaRespuesta;
    }

    public List<RespuestaPreguntaDetalle> getRespuestas() {
        return respuestas;
    }

    public static class RespuestaPreguntaDetalle {
        private String pregunta;
        private String tipo;
        private String textoRespuesta;
        private List<String> opcionesSeleccionadas;
        private Boolean correcta;

        public RespuestaPreguntaDetalle() {
        }

        public RespuestaPreguntaDetalle(
                String pregunta,
                String tipo,
                String textoRespuesta,
                List<String> opcionesSeleccionadas,
                Boolean correcta
        ) {
            this.pregunta = pregunta;
            this.tipo = tipo;
            this.textoRespuesta = textoRespuesta;
            this.opcionesSeleccionadas = opcionesSeleccionadas;
            this.correcta = correcta;
        }

        public String getPregunta() {
            return pregunta;
        }

        public String getTipo() {
            return tipo;
        }

        public String getTextoRespuesta() {
            return textoRespuesta;
        }

        public List<String> getOpcionesSeleccionadas() {
            return opcionesSeleccionadas;
        }

        public Boolean getCorrecta() {
            return correcta;
        }
    }
}