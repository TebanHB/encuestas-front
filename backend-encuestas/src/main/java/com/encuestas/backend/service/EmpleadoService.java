package com.encuestas.backend.service;

import com.encuestas.backend.dto.CrearEmpleadoRequest;
import com.encuestas.backend.dto.EmpleadoResponse;
import com.encuestas.backend.model.Usuario;
import com.encuestas.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmpleadoService {

    private final UsuarioRepository usuarioRepository;

    public EmpleadoService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<EmpleadoResponse> listarEmpleados() {
        List<Usuario> usuarios = usuarioRepository.findAll();

        return usuarios.stream()
                .map(usuario -> new EmpleadoResponse(
                        usuario.getId(),
                        usuario.getNombre(),
                        usuario.getApellido(),
                        usuario.getEmail(),
                        usuario.getRol(),
                        usuario.getActivo(),
                        usuario.getPuedeCrearEncuestas()
                ))
                .toList();
    }

    public EmpleadoResponse crearEmpleado(CrearEmpleadoRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail().trim())) {
            throw new RuntimeException("Ya existe un empleado con ese correo");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre().trim());
        usuario.setApellido(request.getApellido().trim());
        usuario.setEmail(request.getEmail().trim());
        usuario.setPassword(request.getPassword().trim());
        usuario.setRol(request.getRol().trim());
        usuario.setActivo(request.getActivo());
        usuario.setPuedeCrearEncuestas(request.getPuedeCrearEncuestas());
        usuario.setFechaCreacion(LocalDateTime.now());

        Usuario guardado = usuarioRepository.save(usuario);

        return new EmpleadoResponse(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getApellido(),
                guardado.getEmail(),
                guardado.getRol(),
                guardado.getActivo(),
                guardado.getPuedeCrearEncuestas()
        );
    }

    public void eliminarEmpleado(Long id, String currentUserEmail) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        if ("admin@encuestas.com".equalsIgnoreCase(usuario.getEmail())) {
            throw new RuntimeException("No se puede eliminar el administrador principal");
        }

        if (currentUserEmail != null
                && !currentUserEmail.trim().isEmpty()
                && usuario.getEmail() != null
                && usuario.getEmail().equalsIgnoreCase(currentUserEmail.trim())) {
            throw new RuntimeException("No puedes eliminar el usuario con el que tienes la sesión iniciada");
        }

        usuarioRepository.delete(usuario);
    }
}