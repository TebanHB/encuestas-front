package com.encuestas.backend.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "preguntas")
public class Pregunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String titulo;

    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(nullable = false)
    private Boolean obligatoria = false;

    @Column(nullable = false)
    private Integer orden = 0;

    @Column(name = "formato_numeracion", length = 30)
    private String formatoNumeracion = "NUMERO_PARENTESIS";

    @Column(name = "formato_opciones", length = 30)
    private String formatoOpciones = "SIN_PREFIJO";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "encuesta_id", nullable = false)
    private Encuesta encuesta;

    @OneToMany(mappedBy = "pregunta", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC, id ASC")
    private List<OpcionPregunta> opciones = new ArrayList<>();

    public Pregunta() {
    }

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getTipo() {
        return tipo;
    }

    public Boolean getObligatoria() {
        return obligatoria;
    }

    public Integer getOrden() {
        return orden;
    }

    public String getFormatoNumeracion() {
        return formatoNumeracion;
    }

    public String getFormatoOpciones() {
        return formatoOpciones;
    }

    public Encuesta getEncuesta() {
        return encuesta;
    }

    public List<OpcionPregunta> getOpciones() {
        return opciones;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public void setObligatoria(Boolean obligatoria) {
        this.obligatoria = obligatoria;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public void setFormatoNumeracion(String formatoNumeracion) {
        this.formatoNumeracion = formatoNumeracion;
    }

    public void setFormatoOpciones(String formatoOpciones) {
        this.formatoOpciones = formatoOpciones;
    }

    public void setEncuesta(Encuesta encuesta) {
        this.encuesta = encuesta;
    }

    public void setOpciones(List<OpcionPregunta> opciones) {
        this.opciones = opciones;
    }
}