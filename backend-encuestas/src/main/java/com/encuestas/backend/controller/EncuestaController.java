package com.encuestas.backend.controller;

import com.encuestas.backend.dto.CambiarEstadoEncuestaRequest;
import com.encuestas.backend.dto.EncuestaDetalleResponse;
import com.encuestas.backend.dto.EncuestaResponse;
import com.encuestas.backend.dto.GuardarEncuestaRequest;
import com.encuestas.backend.service.AccesoService;
import com.encuestas.backend.service.EncuestaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/encuestas")
public class EncuestaController {

    private final EncuestaService encuestaService;
    private final AccesoService accesoService;

    public EncuestaController(EncuestaService encuestaService, AccesoService accesoService) {
        this.encuestaService = encuestaService;
        this.accesoService = accesoService;
    }

    @GetMapping
    public ResponseEntity<?> listarEncuestas(
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        try {
            accesoService.validarAdmin(userRole);
            List<EncuestaResponse> response = encuestaService.listarEncuestas();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/disponibles-para-empleado")
    public ResponseEntity<?> listarEncuestasDisponiblesParaEmpleado(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestParam String correo
    ) {
        try {
            accesoService.validarAdminOEmpleado(userRole);
            return ResponseEntity.ok(encuestaService.listarEncuestasDisponiblesParaEmpleado(correo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerEncuesta(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id
    ) {
        try {
            accesoService.validarAdminOEmpleado(userRole);
            EncuestaDetalleResponse response = encuestaService.obtenerDetalleEncuesta(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/detalle")
    public ResponseEntity<?> obtenerDetalleEncuesta(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id
    ) {
        try {
            accesoService.validarAdminOEmpleado(userRole);
            EncuestaDetalleResponse response = encuestaService.obtenerDetalleEncuesta(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> guardarEncuesta(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody GuardarEncuestaRequest request
    ) {
        try {
            accesoService.validarAdmin(userRole);
            EncuestaResponse response = encuestaService.guardarEncuesta(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarEncuesta(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id,
            @Valid @RequestBody GuardarEncuestaRequest request
    ) {
        try {
            accesoService.validarAdmin(userRole);
            EncuestaResponse response = encuestaService.actualizarEncuesta(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id,
            @RequestBody CambiarEstadoEncuestaRequest request
    ) {
        try {
            accesoService.validarAdmin(userRole);
            EncuestaResponse response = encuestaService.cambiarEstado(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarEncuesta(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id
    ) {
        try {
            accesoService.validarAdmin(userRole);
            encuestaService.eliminarEncuesta(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/puede-editar")
    public ResponseEntity<?> validarPuedeEditar(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id
    ) {
        try {
            accesoService.validarAdmin(userRole);
            encuestaService.validarPuedeEditar(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/puede-exportar")
    public ResponseEntity<?> validarPuedeExportar(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id
    ) {
        try {
            accesoService.validarAdmin(userRole);
            encuestaService.validarPuedeExportar(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}