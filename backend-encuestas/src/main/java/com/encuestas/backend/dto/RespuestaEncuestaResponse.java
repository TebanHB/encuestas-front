package com.encuestas.backend.dto;

import java.time.LocalDateTime;

public class RespuestaEncuestaResponse {

    private Long id;
    private Long encuestaId;
    private String tituloEncuesta;
    private String nombreParticipante;
    private String correoParticipante;
    private Integer puntaje;
    private LocalDateTime fechaRespuesta;

    public RespuestaEncuestaResponse() {
    }

    public RespuestaEncuestaResponse(
            Long id,
            Long encuestaId,
            String tituloEncuesta,
            String nombreParticipante,
            String correoParticipante,
            Integer puntaje,
            LocalDateTime fechaRespuesta
    ) {
        this.id = id;
        this.encuestaId = encuestaId;
        this.tituloEncuesta = tituloEncuesta;
        this.nombreParticipante = nombreParticipante;
        this.correoParticipante = correoParticipante;
        this.puntaje = puntaje;
        this.fechaRespuesta = fechaRespuesta;
    }

    public Long getId() {
        return id;
    }

    public Long getEncuestaId() {
        return encuestaId;
    }

    public String getTituloEncuesta() {
        return tituloEncuesta;
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
}