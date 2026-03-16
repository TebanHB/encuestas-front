package com.encuestas.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CambiarPasswordRequest {

    @NotBlank(message = "La nueva contraseña es obligatoria")
    private String password;

    public CambiarPasswordRequest() {
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}