package com.encuestas.backend.controller;

import com.encuestas.backend.service.AccesoService;
import com.encuestas.backend.service.ExportacionExcelService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/exportaciones")
public class ExportacionExcelController {

    private final ExportacionExcelService exportacionExcelService;
    private final AccesoService accesoService;

    public ExportacionExcelController(
            ExportacionExcelService exportacionExcelService,
            AccesoService accesoService
    ) {
        this.exportacionExcelService = exportacionExcelService;
        this.accesoService = accesoService;
    }

    @GetMapping("/encuestas/{encuestaId}/excel")
    public ResponseEntity<byte[]> exportarEncuestaExcel(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long encuestaId
    ) {
        accesoService.validarAdmin(userRole);

        byte[] archivo = exportacionExcelService.exportarEncuestaCompleta(encuestaId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=encuesta_" + encuestaId + "_general.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(archivo);
    }

    @GetMapping("/respuestas/{respuestaId}/excel")
    public ResponseEntity<byte[]> exportarRespuestaIndividualExcel(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long respuestaId
    ) {
        accesoService.validarAdmin(userRole);

        byte[] archivo = exportacionExcelService.exportarRespuestaIndividual(respuestaId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=respuesta_" + respuestaId + "_individual.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(archivo);
    }
}