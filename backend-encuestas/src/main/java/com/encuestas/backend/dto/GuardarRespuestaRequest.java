package com.encuestas.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public class GuardarRespuestaRequest {

    @NotNull(message = "El usuario es obligatorio")
    private Long usuarioId;

    @NotNull(message = "La encuesta es obligatoria")
    private Long encuestaId;

    private List<RespuestaPreguntaRequest> respuestas;

    public GuardarRespuestaRequest() {
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public Long getEncuestaId() {
        return encuestaId;
    }

    public void setEncuestaId(Long encuestaId) {
        this.encuestaId = encuestaId;
    }

    public List<RespuestaPreguntaRequest> getRespuestas() {
        return respuestas;
    }

    public void setRespuestas(List<RespuestaPreguntaRequest> respuestas) {
        this.respuestas = respuestas;
    }

    public static class RespuestaPreguntaRequest {

        @NotNull(message = "La pregunta es obligatoria")
        private Long preguntaId;

        private String textoRespuesta;

        private List<Long> opcionIds;

        public RespuestaPreguntaRequest() {
        }

        public Long getPreguntaId() {
            return preguntaId;
        }

        public void setPreguntaId(Long preguntaId) {
            this.preguntaId = preguntaId;
        }

        public String getTextoRespuesta() {
            return textoRespuesta;
        }

        public void setTextoRespuesta(String textoRespuesta) {
            this.textoRespuesta = textoRespuesta;
        }

        public List<Long> getOpcionIds() {
            return opcionIds;
        }

        public void setOpcionIds(List<Long> opcionIds) {
            this.opcionIds = opcionIds;
        }
    }
}