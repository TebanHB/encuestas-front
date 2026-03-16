package com.encuestas.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class ActualizarEstadoEncuestaRequest {

    @NotBlank(message = "El estado es obligatorio")
    private String estado;

    public ActualizarEstadoEncuestaRequest() {
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}