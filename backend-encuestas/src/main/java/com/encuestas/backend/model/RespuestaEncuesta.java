package com.encuestas.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "respuestas_encuesta",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_respuesta_encuesta_usuario", columnNames = {"encuesta_id", "usuario_id"})
        }
)
public class RespuestaEncuesta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "encuesta_id", nullable = false)
    private Encuesta encuesta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "nombre_participante", length = 200)
    private String nombreParticipante;

    @Column(name = "correo_participante", length = 150)
    private String correoParticipante;

    @Column(name = "fecha_respuesta", nullable = false)
    private LocalDateTime fechaRespuesta;

    @Column
    private Integer puntaje = 0;

    @OneToMany(mappedBy = "respuestaEncuesta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RespuestaPregunta> respuestasPregunta = new ArrayList<>();

    public RespuestaEncuesta() {
    }

    public Long getId() {
        return id;
    }

    public Encuesta getEncuesta() {
        return encuesta;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public String getNombreParticipante() {
        return nombreParticipante;
    }

    public String getCorreoParticipante() {
        return correoParticipante;
    }

    public LocalDateTime getFechaRespuesta() {
        return fechaRespuesta;
    }

    public Integer getPuntaje() {
        return puntaje;
    }

    public List<RespuestaPregunta> getRespuestasPregunta() {
        return respuestasPregunta;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setEncuesta(Encuesta encuesta) {
        this.encuesta = encuesta;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public void setNombreParticipante(String nombreParticipante) {
        this.nombreParticipante = nombreParticipante;
    }

    public void setCorreoParticipante(String correoParticipante) {
        this.correoParticipante = correoParticipante;
    }

    public void setFechaRespuesta(LocalDateTime fechaRespuesta) {
        this.fechaRespuesta = fechaRespuesta;
    }

    public void setPuntaje(Integer puntaje) {
        this.puntaje = puntaje;
    }

    public void setRespuestasPregunta(List<RespuestaPregunta> respuestasPregunta) {
        this.respuestasPregunta = respuestasPregunta;
    }
}