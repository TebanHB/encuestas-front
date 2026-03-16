package com.encuestas.backend.service;

import org.springframework.stereotype.Service;

@Service
public class AccesoService {

    public void validarAdmin(String userRole) {
        if (userRole == null || userRole.trim().isEmpty()) {
            throw new RuntimeException("Rol no enviado");
        }

        if (!"ADMIN".equalsIgnoreCase(userRole.trim())) {
            throw new RuntimeException("No tienes permisos para realizar esta acción");
        }
    }

    public void validarAdminOEmpleado(String userRole) {
        if (userRole == null || userRole.trim().isEmpty()) {
            throw new RuntimeException("Rol no enviado");
        }

        String rol = userRole.trim().toUpperCase();

        if (!"ADMIN".equals(rol) && !"EMPLEADO".equals(rol)) {
            throw new RuntimeException("Rol no permitido");
        }
    }
}