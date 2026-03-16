package com.encuestas.backend.controller;

import com.encuestas.backend.dto.DashboardAdminResponse;
import com.encuestas.backend.dto.DashboardEmpleadoResponse;
import com.encuestas.backend.service.DashboardAdminService;
import com.encuestas.backend.service.DashboardEmpleadoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
public class DashboardAdminController {

    private final DashboardAdminService dashboardAdminService;
    private final DashboardEmpleadoService dashboardEmpleadoService;

    public DashboardAdminController(
            DashboardAdminService dashboardAdminService,
            DashboardEmpleadoService dashboardEmpleadoService
    ) {
        this.dashboardAdminService = dashboardAdminService;
        this.dashboardEmpleadoService = dashboardEmpleadoService;
    }

    @GetMapping("/admin")
    public ResponseEntity<?> obtenerDashboardAdmin() {
        try {
            DashboardAdminResponse response = dashboardAdminService.obtenerDashboardAdmin();
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/empleado")
    public ResponseEntity<?> obtenerDashboardEmpleado(@RequestParam Long usuarioId) {
        try {
            DashboardEmpleadoResponse response = dashboardEmpleadoService.obtenerDashboardEmpleado(usuarioId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}