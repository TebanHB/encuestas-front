package com.encuestas.backend.controller;

import com.encuestas.backend.dto.CrearEmpleadoRequest;
import com.encuestas.backend.dto.EmpleadoResponse;
import com.encuestas.backend.service.AccesoService;
import com.encuestas.backend.service.EmpleadoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/empleados")
public class EmpleadoController {

    private final EmpleadoService empleadoService;
    private final AccesoService accesoService;

    public EmpleadoController(EmpleadoService empleadoService, AccesoService accesoService) {
        this.empleadoService = empleadoService;
        this.accesoService = accesoService;
    }

    @GetMapping
    public ResponseEntity<?> listarEmpleados(
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        try {
            accesoService.validarAdmin(userRole);
            List<EmpleadoResponse> response = empleadoService.listarEmpleados();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> crearEmpleado(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody CrearEmpleadoRequest request
    ) {
        try {
            accesoService.validarAdmin(userRole);
            EmpleadoResponse response = empleadoService.crearEmpleado(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarEmpleado(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Email", required = false) String currentUserEmail
    ) {
        try {
            accesoService.validarAdmin(userRole);
            empleadoService.eliminarEmpleado(id, currentUserEmail);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}