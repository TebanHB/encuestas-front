package com.encuestas.backend.dto;

public class UserResponse {

    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String rol;
    private Boolean puedeCrearEncuestas;
    private Boolean activo;

    public UserResponse() {
    }

    public UserResponse(Long id, String nombre, String apellido, String email, String rol, Boolean puedeCrearEncuestas, Boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.rol = rol;
        this.puedeCrearEncuestas = puedeCrearEncuestas;
        this.activo = activo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public Boolean getPuedeCrearEncuestas() {
        return puedeCrearEncuestas;
    }

    public void setPuedeCrearEncuestas(Boolean puedeCrearEncuestas) {
        this.puedeCrearEncuestas = puedeCrearEncuestas;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}