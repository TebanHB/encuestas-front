package com.encuestas.backend.dto;

import java.time.LocalDateTime;

public class ResultadoEncuestaAdminResponse {

    private Long encuestaId;
    private String titulo;
    private String descripcion;
    private String estado;
    private Boolean modoCalificable;
    private Integer cantidadPreguntas;
    private Long cantidadRespuestas;
    private LocalDateTime fechaCreacion;

    public ResultadoEncuestaAdminResponse() {
    }

    public ResultadoEncuestaAdminResponse(
            Long encuestaId,
            String titulo,
            String descripcion,
            String estado,
            Boolean modoCalificable,
            Integer cantidadPreguntas,
            Long cantidadRespuestas,
            LocalDateTime fechaCreacion
    ) {
        this.encuestaId = encuestaId;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.estado = estado;
        this.modoCalificable = modoCalificable;
        this.cantidadPreguntas = cantidadPreguntas;
        this.cantidadRespuestas = cantidadRespuestas;
        this.fechaCreacion = fechaCreacion;
    }

    public Long getEncuestaId() {
        return encuestaId;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public Boolean getModoCalificable() {
        return modoCalificable;
    }

    public Integer getCantidadPreguntas() {
        return cantidadPreguntas;
    }

    public Long getCantidadRespuestas() {
        return cantidadRespuestas;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}