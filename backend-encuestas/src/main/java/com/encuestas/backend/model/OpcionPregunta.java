package com.encuestas.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "opciones_pregunta")
public class OpcionPregunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String texto;

    @Column(nullable = false)
    private Boolean correcta = false;

    @Column(nullable = false)
    private Integer orden = 0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pregunta_id", nullable = false)
    private Pregunta pregunta;

    public OpcionPregunta() {
    }

    public Long getId() {
        return id;
    }

    public String getTexto() {
        return texto;
    }

    public Boolean getCorrecta() {
        return correcta;
    }

    public Integer getOrden() {
        return orden;
    }

    public Pregunta getPregunta() {
        return pregunta;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public void setCorrecta(Boolean correcta) {
        this.correcta = correcta;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public void setPregunta(Pregunta pregunta) {
        this.pregunta = pregunta;
    }
}