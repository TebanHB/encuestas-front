package com.encuestas.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "respuestas_opcion")
public class RespuestaOpcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "respuesta_pregunta_id", nullable = false)
    private RespuestaPregunta respuestaPregunta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opcion_pregunta_id", nullable = false)
    private OpcionPregunta opcionPregunta;

    public RespuestaOpcion() {
    }

    public Long getId() {
        return id;
    }

    public RespuestaPregunta getRespuestaPregunta() {
        return respuestaPregunta;
    }

    public void setRespuestaPregunta(RespuestaPregunta respuestaPregunta) {
        this.respuestaPregunta = respuestaPregunta;
    }

    public OpcionPregunta getOpcionPregunta() {
        return opcionPregunta;
    }

    public void setOpcionPregunta(OpcionPregunta opcionPregunta) {
        this.opcionPregunta = opcionPregunta;
    }
}