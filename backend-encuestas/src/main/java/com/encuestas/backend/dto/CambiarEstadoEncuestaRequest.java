package com.encuestas.backend.dto;

public class CambiarEstadoEncuestaRequest {

    private String estado;

    public CambiarEstadoEncuestaRequest() {
    }

    public CambiarEstadoEncuestaRequest(String estado) {
        this.estado = estado;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}