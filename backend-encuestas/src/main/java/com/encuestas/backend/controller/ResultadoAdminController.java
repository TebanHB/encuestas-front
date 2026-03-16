package com.encuestas.backend.controller;

import com.encuestas.backend.dto.RespuestaEncuestaDetalleAdminResponse;
import com.encuestas.backend.dto.ResultadoEncuestaAdminResponse;
import com.encuestas.backend.service.AccesoService;
import com.encuestas.backend.service.ResultadoAdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/resultados-admin")
public class ResultadoAdminController {

    private final ResultadoAdminService resultadoAdminService;
    private final AccesoService accesoService;

    public ResultadoAdminController(ResultadoAdminService resultadoAdminService, AccesoService accesoService) {
        this.resultadoAdminService = resultadoAdminService;
        this.accesoService = accesoService;
    }

    @GetMapping("/encuestas")
    public ResponseEntity<?> listarEncuestasConResultados(
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        try {
            accesoService.validarAdmin(userRole);
            List<ResultadoEncuestaAdminResponse> response = resultadoAdminService.listarEncuestasConResultados();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/encuestas/{encuestaId}/respuestas")
    public ResponseEntity<?> listarRespuestasPorEncuesta(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long encuestaId
    ) {
        try {
            accesoService.validarAdmin(userRole);
            List<RespuestaEncuestaDetalleAdminResponse> response = resultadoAdminService.listarRespuestasPorEncuesta(encuestaId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @DeleteMapping("/respuestas/{respuestaId}")
    public ResponseEntity<?> eliminarRespuesta(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long respuestaId
    ) {
        try {
            accesoService.validarAdmin(userRole);
            resultadoAdminService.eliminarRespuesta(respuestaId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}