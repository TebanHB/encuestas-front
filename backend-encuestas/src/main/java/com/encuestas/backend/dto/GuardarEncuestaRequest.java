package com.encuestas.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class GuardarEncuestaRequest {

    @NotBlank(message = "El título es obligatorio")
    private String titulo;

    private String descripcion;

    private Boolean modoCalificable = false;

    @NotEmpty(message = "Debes agregar al menos una pregunta")
    private List<PreguntaRequest> preguntas;

    public GuardarEncuestaRequest() {
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public Boolean getModoCalificable() {
        return modoCalificable;
    }

    public List<PreguntaRequest> getPreguntas() {
        return preguntas;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setModoCalificable(Boolean modoCalificable) {
        this.modoCalificable = modoCalificable;
    }

    public void setPreguntas(List<PreguntaRequest> preguntas) {
        this.preguntas = preguntas;
    }

    public static class PreguntaRequest {

        @NotBlank(message = "El título de la pregunta es obligatorio")
        private String titulo;

        @NotBlank(message = "El tipo de la pregunta es obligatorio")
        private String tipo;

        private Boolean obligatoria = false;

        private Integer orden = 0;

        private String formatoNumeracion = "NUMERO_PARENTESIS";

        private String formatoOpciones = "SIN_PREFIJO";

        private List<OpcionRequest> opciones;

        public PreguntaRequest() {
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

        public List<OpcionRequest> getOpciones() {
            return opciones;
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

        public void setOpciones(List<OpcionRequest> opciones) {
            this.opciones = opciones;
        }
    }

    public static class OpcionRequest {

        @NotBlank(message = "El texto de la opción es obligatorio")
        private String texto;

        private Boolean correcta = false;

        private Integer orden = 0;

        public OpcionRequest() {
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

        public void setTexto(String texto) {
            this.texto = texto;
        }

        public void setCorrecta(Boolean correcta) {
            this.correcta = correcta;
        }

        public void setOrden(Integer orden) {
            this.orden = orden;
        }
    }
}