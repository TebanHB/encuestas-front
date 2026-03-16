package com.encuestas.backend.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "respuestas_pregunta")
public class RespuestaPregunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "texto_respuesta", columnDefinition = "TEXT")
    private String textoRespuesta;

    @Column(nullable = false)
    private Boolean correcta = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "respuesta_encuesta_id", nullable = false)
    private RespuestaEncuesta respuestaEncuesta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pregunta_id", nullable = false)
    private Pregunta pregunta;

    @OneToMany(mappedBy = "respuestaPregunta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RespuestaOpcion> respuestasOpcion = new ArrayList<>();

    public RespuestaPregunta() {
    }

    public Long getId() {
        return id;
    }

    public String getTextoRespuesta() {
        return textoRespuesta;
    }

    public void setTextoRespuesta(String textoRespuesta) {
        this.textoRespuesta = textoRespuesta;
    }

    public Boolean getCorrecta() {
        return correcta;
    }

    public void setCorrecta(Boolean correcta) {
        this.correcta = correcta;
    }

    public RespuestaEncuesta getRespuestaEncuesta() {
        return respuestaEncuesta;
    }

    public void setRespuestaEncuesta(RespuestaEncuesta respuestaEncuesta) {
        this.respuestaEncuesta = respuestaEncuesta;
    }

    public Pregunta getPregunta() {
        return pregunta;
    }

    public void setPregunta(Pregunta pregunta) {
        this.pregunta = pregunta;
    }

    public List<RespuestaOpcion> getRespuestasOpcion() {
        return respuestasOpcion;
    }

    public void setRespuestasOpcion(List<RespuestaOpcion> respuestasOpcion) {
        this.respuestasOpcion = respuestasOpcion;
    }
}