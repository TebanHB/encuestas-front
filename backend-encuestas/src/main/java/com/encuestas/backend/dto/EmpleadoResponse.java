package com.encuestas.backend.dto;

public class EmpleadoResponse {

    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String rol;
    private Boolean activo;
    private Boolean puedeCrearEncuestas;

    public EmpleadoResponse() {
    }

    public EmpleadoResponse(Long id, String nombre, String apellido, String email, String rol, Boolean activo, Boolean puedeCrearEncuestas) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.rol = rol;
        this.activo = activo;
        this.puedeCrearEncuestas = puedeCrearEncuestas;
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public String getEmail() {
        return email;
    }

    public String getRol() {
        return rol;
    }

    public Boolean getActivo() {
        return activo;
    }

    public Boolean getPuedeCrearEncuestas() {
        return puedeCrearEncuestas;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public void setPuedeCrearEncuestas(Boolean puedeCrearEncuestas) {
        this.puedeCrearEncuestas = puedeCrearEncuestas;
    }
}