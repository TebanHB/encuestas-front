package com.encuestas.backend.dto;

import java.time.LocalDateTime;

public class EncuestaResponse {

    private Long id;
    private String titulo;
    private String descripcion;
    private String estado;
    private Boolean modoCalificable;
    private LocalDateTime fechaCreacion;
    private Integer cantidadPreguntas;

    public EncuestaResponse() {
    }

    public EncuestaResponse(
            Long id,
            String titulo,
            String descripcion,
            String estado,
            Boolean modoCalificable,
            LocalDateTime fechaCreacion,
            Integer cantidadPreguntas
    ) {
        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.estado = estado;
        this.modoCalificable = modoCalificable;
        this.fechaCreacion = fechaCreacion;
        this.cantidadPreguntas = cantidadPreguntas;
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

    public String getEstado() {
        return estado;
    }

    public Boolean getModoCalificable() {
        return modoCalificable;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public Integer getCantidadPreguntas() {
        return cantidadPreguntas;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public void setModoCalificable(Boolean modoCalificable) {
        this.modoCalificable = modoCalificable;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public void setCantidadPreguntas(Integer cantidadPreguntas) {
        this.cantidadPreguntas = cantidadPreguntas;
    }
}