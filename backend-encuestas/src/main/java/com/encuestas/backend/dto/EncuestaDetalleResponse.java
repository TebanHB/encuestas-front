package com.encuestas.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class EncuestaDetalleResponse {

    private Long id;
    private String titulo;
    private String descripcion;
    private String estado;
    private Boolean modoCalificable;
    private LocalDateTime fechaCreacion;
    private List<PreguntaDetalleResponse> preguntas;

    public EncuestaDetalleResponse() {
    }

    public EncuestaDetalleResponse(
            Long id,
            String titulo,
            String descripcion,
            String estado,
            Boolean modoCalificable,
            LocalDateTime fechaCreacion,
            List<PreguntaDetalleResponse> preguntas
    ) {
        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.estado = estado;
        this.modoCalificable = modoCalificable;
        this.fechaCreacion = fechaCreacion;
        this.preguntas = preguntas;
    }

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public Boolean getModoCalificable() {
        return modoCalificable;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public List<PreguntaDetalleResponse> getPreguntas() {
        return preguntas;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public void setModoCalificable(Boolean modoCalificable) {
        this.modoCalificable = modoCalificable;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public void setPreguntas(List<PreguntaDetalleResponse> preguntas) {
        this.preguntas = preguntas;
    }

    public static class PreguntaDetalleResponse {
        private Long id;
        private String titulo;
        private String tipo;
        private Boolean obligatoria;
        private Integer orden;
        private String formatoNumeracion;
        private String formatoOpciones;
        private List<OpcionDetalleResponse> opciones;

        public PreguntaDetalleResponse() {
        }

        public PreguntaDetalleResponse(
                Long id,
                String titulo,
                String tipo,
                Boolean obligatoria,
                Integer orden,
                String formatoNumeracion,
                String formatoOpciones,
                List<OpcionDetalleResponse> opciones
        ) {
            this.id = id;
            this.titulo = titulo;
            this.tipo = tipo;
            this.obligatoria = obligatoria;
            this.orden = orden;
            this.formatoNumeracion = formatoNumeracion;
            this.formatoOpciones = formatoOpciones;
            this.opciones = opciones;
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

        public List<OpcionDetalleResponse> getOpciones() {
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

        public void setOpciones(List<OpcionDetalleResponse> opciones) {
            this.opciones = opciones;
        }
    }

    public static class OpcionDetalleResponse {
        private Long id;
        private String texto;
        private Boolean correcta;
        private Integer orden;

        public OpcionDetalleResponse() {
        }

        public OpcionDetalleResponse(Long id, String texto, Boolean correcta, Integer orden) {
            this.id = id;
            this.texto = texto;
            this.correcta = correcta;
            this.orden = orden;
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
    }
}