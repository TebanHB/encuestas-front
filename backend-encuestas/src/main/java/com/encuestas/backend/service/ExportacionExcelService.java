package com.encuestas.backend.service;

import com.encuestas.backend.model.Encuesta;
import com.encuestas.backend.model.RespuestaEncuesta;
import com.encuestas.backend.model.RespuestaOpcion;
import com.encuestas.backend.model.RespuestaPregunta;
import com.encuestas.backend.repository.EncuestaRepository;
import com.encuestas.backend.repository.RespuestaEncuestaRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExportacionExcelService {

    private final EncuestaRepository encuestaRepository;
    private final RespuestaEncuestaRepository respuestaEncuestaRepository;

    private static final DateTimeFormatter FECHA_HORA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final DateTimeFormatter FECHA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORA_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    public ExportacionExcelService(
            EncuestaRepository encuestaRepository,
            RespuestaEncuestaRepository respuestaEncuestaRepository
    ) {
        this.encuestaRepository = encuestaRepository;
        this.respuestaEncuestaRepository = respuestaEncuestaRepository;
    }

    @Transactional(readOnly = true)
    public byte[] exportarEncuestaCompleta(Long encuestaId) {
        Encuesta encuesta = encuestaRepository.findById(encuestaId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));

        List<RespuestaEncuesta> respuestas = respuestaEncuestaRepository.findByEncuestaIdOrderByFechaRespuestaDesc(encuestaId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle tituloStyle = crearEstiloTitulo(workbook);
            CellStyle encabezadoStyle = crearEstiloEncabezado(workbook);
            CellStyle datoStyle = crearEstiloDato(workbook);

            Sheet resumenSheet = workbook.createSheet("Resumen");
            Sheet detalleSheet = workbook.createSheet("Detalle respuestas");

            construirSheetResumenEncuesta(resumenSheet, encuesta, respuestas, tituloStyle, encabezadoStyle, datoStyle);
            construirSheetDetalleGeneral(detalleSheet, encuesta, respuestas, tituloStyle, encabezadoStyle, datoStyle);

            autoSizeColumnas(resumenSheet, 6);
            autoSizeColumnas(detalleSheet, 8);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el archivo Excel", e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportarRespuestaIndividual(Long respuestaId) {
        RespuestaEncuesta respuesta = respuestaEncuestaRepository.findById(respuestaId)
                .orElseThrow(() -> new RuntimeException("Respuesta no encontrada"));

        Encuesta encuesta = respuesta.getEncuesta();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle tituloStyle = crearEstiloTitulo(workbook);
            CellStyle encabezadoStyle = crearEstiloEncabezado(workbook);
            CellStyle datoStyle = crearEstiloDato(workbook);

            Sheet sheet = workbook.createSheet("Respuesta individual");

            construirSheetRespuestaIndividual(sheet, encuesta, respuesta, tituloStyle, encabezadoStyle, datoStyle);

            autoSizeColumnas(sheet, 4);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el archivo Excel individual", e);
        }
    }

    private void construirSheetResumenEncuesta(
            Sheet sheet,
            Encuesta encuesta,
            List<RespuestaEncuesta> respuestas,
            CellStyle tituloStyle,
            CellStyle encabezadoStyle,
            CellStyle datoStyle
    ) {
        int rowIndex = 0;

        Row tituloRow = sheet.createRow(rowIndex++);
        crearCelda(tituloRow, 0, "Resumen general de encuesta", tituloStyle);

        rowIndex++;

        Row row1 = sheet.createRow(rowIndex++);
        crearCelda(row1, 0, "Encuesta", encabezadoStyle);
        crearCelda(row1, 1, encuesta.getTitulo(), datoStyle);

        Row row2 = sheet.createRow(rowIndex++);
        crearCelda(row2, 0, "Descripción", encabezadoStyle);
        crearCelda(row2, 1, encuesta.getDescripcion() != null ? encuesta.getDescripcion() : "Sin descripción", datoStyle);

        Row row3 = sheet.createRow(rowIndex++);
        crearCelda(row3, 0, "Estado", encabezadoStyle);
        crearCelda(row3, 1, normalizarEstadoTexto(encuesta.getEstado()), datoStyle);

        Row row4 = sheet.createRow(rowIndex++);
        crearCelda(row4, 0, "Tipo", encabezadoStyle);
        crearCelda(row4, 1, Boolean.TRUE.equals(encuesta.getModoCalificable()) ? "Cuestionario" : "Encuesta", datoStyle);

        Row row5 = sheet.createRow(rowIndex++);
        crearCelda(row5, 0, "Cantidad de respuestas", encabezadoStyle);
        crearCelda(row5, 1, String.valueOf(respuestas.size()), datoStyle);

        rowIndex += 2;

        Row encabezados = sheet.createRow(rowIndex++);
        crearCelda(encabezados, 0, "ID respuesta", encabezadoStyle);
        crearCelda(encabezados, 1, "Participante", encabezadoStyle);
        crearCelda(encabezados, 2, "Correo", encabezadoStyle);
        crearCelda(encabezados, 3, "Fecha", encabezadoStyle);
        crearCelda(encabezados, 4, "Hora", encabezadoStyle);
        crearCelda(encabezados, 5, "Fecha y hora completa", encabezadoStyle);

        for (RespuestaEncuesta respuesta : respuestas) {
            Row row = sheet.createRow(rowIndex++);
            crearCelda(row, 0, String.valueOf(respuesta.getId()), datoStyle);
            crearCelda(row, 1, valorSeguro(respuesta.getNombreParticipante()), datoStyle);
            crearCelda(row, 2, valorSeguro(respuesta.getCorreoParticipante()), datoStyle);
            crearCelda(row, 3, respuesta.getFechaRespuesta() != null ? respuesta.getFechaRespuesta().format(FECHA_FORMATTER) : "", datoStyle);
            crearCelda(row, 4, respuesta.getFechaRespuesta() != null ? respuesta.getFechaRespuesta().format(HORA_FORMATTER) : "", datoStyle);
            crearCelda(row, 5, respuesta.getFechaRespuesta() != null ? respuesta.getFechaRespuesta().format(FECHA_HORA_FORMATTER) : "", datoStyle);
        }
    }

    private void construirSheetDetalleGeneral(
            Sheet sheet,
            Encuesta encuesta,
            List<RespuestaEncuesta> respuestas,
            CellStyle tituloStyle,
            CellStyle encabezadoStyle,
            CellStyle datoStyle
    ) {
        int rowIndex = 0;

        Row tituloRow = sheet.createRow(rowIndex++);
        crearCelda(tituloRow, 0, "Detalle general de respuestas", tituloStyle);

        rowIndex++;

        Row encabezados = sheet.createRow(rowIndex++);
        crearCelda(encabezados, 0, "Participante", encabezadoStyle);
        crearCelda(encabezados, 1, "Correo", encabezadoStyle);
        crearCelda(encabezados, 2, "Fecha", encabezadoStyle);
        crearCelda(encabezados, 3, "Hora", encabezadoStyle);
        crearCelda(encabezados, 4, "Pregunta", encabezadoStyle);
        crearCelda(encabezados, 5, "Tipo", encabezadoStyle);
        crearCelda(encabezados, 6, "Respuesta", encabezadoStyle);
        crearCelda(encabezados, 7, "Opciones seleccionadas", encabezadoStyle);

        for (RespuestaEncuesta respuestaEncuesta : respuestas) {
            List<RespuestaPregunta> respuestasPregunta = respuestaEncuesta.getRespuestasPregunta().stream()
                    .sorted(Comparator.comparing(r -> r.getPregunta().getOrden() != null ? r.getPregunta().getOrden() : Integer.MAX_VALUE))
                    .toList();

            for (RespuestaPregunta respuestaPregunta : respuestasPregunta) {
                String opcionesSeleccionadas = respuestaPregunta.getRespuestasOpcion().stream()
                        .map(RespuestaOpcion::getOpcionPregunta)
                        .map(opcion -> opcion != null ? opcion.getTexto() : "")
                        .filter(texto -> texto != null && !texto.isBlank())
                        .collect(Collectors.joining(", "));

                Row row = sheet.createRow(rowIndex++);
                crearCelda(row, 0, valorSeguro(respuestaEncuesta.getNombreParticipante()), datoStyle);
                crearCelda(row, 1, valorSeguro(respuestaEncuesta.getCorreoParticipante()), datoStyle);
                crearCelda(row, 2, respuestaEncuesta.getFechaRespuesta() != null ? respuestaEncuesta.getFechaRespuesta().format(FECHA_FORMATTER) : "", datoStyle);
                crearCelda(row, 3, respuestaEncuesta.getFechaRespuesta() != null ? respuestaEncuesta.getFechaRespuesta().format(HORA_FORMATTER) : "", datoStyle);
                crearCelda(row, 4, respuestaPregunta.getPregunta() != null ? valorSeguro(respuestaPregunta.getPregunta().getTitulo()) : "", datoStyle);
                crearCelda(row, 5, respuestaPregunta.getPregunta() != null ? normalizarTipoTexto(respuestaPregunta.getPregunta().getTipo()) : "", datoStyle);
                crearCelda(row, 6, valorSeguro(respuestaPregunta.getTextoRespuesta()), datoStyle);
                crearCelda(row, 7, opcionesSeleccionadas, datoStyle);
            }
        }
    }

    private void construirSheetRespuestaIndividual(
            Sheet sheet,
            Encuesta encuesta,
            RespuestaEncuesta respuesta,
            CellStyle tituloStyle,
            CellStyle encabezadoStyle,
            CellStyle datoStyle
    ) {
        int rowIndex = 0;

        Row tituloRow = sheet.createRow(rowIndex++);
        crearCelda(tituloRow, 0, "Respuesta individual", tituloStyle);

        rowIndex++;

        Row row1 = sheet.createRow(rowIndex++);
        crearCelda(row1, 0, "Encuesta", encabezadoStyle);
        crearCelda(row1, 1, valorSeguro(encuesta.getTitulo()), datoStyle);

        Row row2 = sheet.createRow(rowIndex++);
        crearCelda(row2, 0, "Participante", encabezadoStyle);
        crearCelda(row2, 1, valorSeguro(respuesta.getNombreParticipante()), datoStyle);

        Row row3 = sheet.createRow(rowIndex++);
        crearCelda(row3, 0, "Correo", encabezadoStyle);
        crearCelda(row3, 1, valorSeguro(respuesta.getCorreoParticipante()), datoStyle);

        Row row4 = sheet.createRow(rowIndex++);
        crearCelda(row4, 0, "Fecha", encabezadoStyle);
        crearCelda(row4, 1, respuesta.getFechaRespuesta() != null ? respuesta.getFechaRespuesta().format(FECHA_FORMATTER) : "", datoStyle);

        Row row5 = sheet.createRow(rowIndex++);
        crearCelda(row5, 0, "Hora", encabezadoStyle);
        crearCelda(row5, 1, respuesta.getFechaRespuesta() != null ? respuesta.getFechaRespuesta().format(HORA_FORMATTER) : "", datoStyle);

        Row row6 = sheet.createRow(rowIndex++);
        crearCelda(row6, 0, "Fecha y hora completa", encabezadoStyle);
        crearCelda(row6, 1, respuesta.getFechaRespuesta() != null ? respuesta.getFechaRespuesta().format(FECHA_HORA_FORMATTER) : "", datoStyle);

        rowIndex += 2;

        Row encabezados = sheet.createRow(rowIndex++);
        crearCelda(encabezados, 0, "Pregunta", encabezadoStyle);
        crearCelda(encabezados, 1, "Tipo", encabezadoStyle);
        crearCelda(encabezados, 2, "Respuesta", encabezadoStyle);
        crearCelda(encabezados, 3, "Opciones seleccionadas", encabezadoStyle);

        List<RespuestaPregunta> respuestasPregunta = respuesta.getRespuestasPregunta().stream()
                .sorted(Comparator.comparing(r -> r.getPregunta().getOrden() != null ? r.getPregunta().getOrden() : Integer.MAX_VALUE))
                .toList();

        for (RespuestaPregunta respuestaPregunta : respuestasPregunta) {
            String opcionesSeleccionadas = respuestaPregunta.getRespuestasOpcion().stream()
                    .map(RespuestaOpcion::getOpcionPregunta)
                    .map(opcion -> opcion != null ? opcion.getTexto() : "")
                    .filter(texto -> texto != null && !texto.isBlank())
                    .collect(Collectors.joining(", "));

            Row row = sheet.createRow(rowIndex++);
            crearCelda(row, 0, respuestaPregunta.getPregunta() != null ? valorSeguro(respuestaPregunta.getPregunta().getTitulo()) : "", datoStyle);
            crearCelda(row, 1, respuestaPregunta.getPregunta() != null ? normalizarTipoTexto(respuestaPregunta.getPregunta().getTipo()) : "", datoStyle);
            crearCelda(row, 2, valorSeguro(respuestaPregunta.getTextoRespuesta()), datoStyle);
            crearCelda(row, 3, opcionesSeleccionadas, datoStyle);
        }
    }

    private CellStyle crearEstiloTitulo(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }

    private CellStyle crearEstiloEncabezado(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setWrapText(true);
        return style;
    }

    private CellStyle crearEstiloDato(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setWrapText(true);
        style.setVerticalAlignment(VerticalAlignment.TOP);
        return style;
    }

    private void crearCelda(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value != null ? value : "");
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private void autoSizeColumnas(Sheet sheet, int cantidadColumnas) {
        for (int i = 0; i < cantidadColumnas; i++) {
            sheet.autoSizeColumn(i);
            int currentWidth = sheet.getColumnWidth(i);
            int maxWidth = 40 * 256;
            if (currentWidth > maxWidth) {
                sheet.setColumnWidth(i, maxWidth);
            }
        }
    }

    private String valorSeguro(String valor) {
        return valor != null ? valor : "";
    }

    private String normalizarEstadoTexto(String estado) {
        String valor = estado == null ? "" : estado.trim().toUpperCase();

        return switch (valor) {
            case "DRAFT", "BORRADOR" -> "Borrador";
            case "OPEN", "ABIERTA" -> "Abierta";
            case "CLOSED", "CERRADA" -> "Cerrada";
            default -> valor;
        };
    }

    private String normalizarTipoTexto(String tipo) {
        if (tipo == null) {
            return "";
        }

        return switch (tipo.trim().toUpperCase()) {
            case "TEXTO", "TEXTO_CORTO" -> "Texto corto";
            case "TEXTO_LARGO" -> "Texto largo";
            case "OPCION_UNICA" -> "Opción única";
            case "OPCION_MULTIPLE" -> "Opción múltiple";
            case "SI_NO" -> "Sí / No";
            case "COMPLETAR_ORACION" -> "Completar oración";
            case "NUMERICA" -> "Numérica";
            default -> tipo;
        };
    }
}