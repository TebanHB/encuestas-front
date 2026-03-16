package com.encuestas.backend.service;

import com.encuestas.backend.dto.LoginRequest;
import com.encuestas.backend.dto.LoginResponse;
import com.encuestas.backend.dto.UserResponse;
import com.encuestas.backend.model.Usuario;
import com.encuestas.backend.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new RuntimeException("El usuario está inactivo");
        }

        String passwordIngresada = request.getPassword().trim();
        String passwordGuardada = usuario.getPassword();

        boolean passwordValida = false;

        if (passwordGuardada != null && passwordGuardada.startsWith("$2")) {
            passwordValida = passwordEncoder.matches(passwordIngresada, passwordGuardada);
        } else if (passwordGuardada != null && passwordGuardada.equals(passwordIngresada)) {
            passwordValida = true;

            usuario.setPassword(passwordEncoder.encode(passwordIngresada));
            usuarioRepository.save(usuario);
        }

        if (!passwordValida) {
            throw new RuntimeException("Credenciales inválidas");
        }

        String token = UUID.randomUUID().toString();

        UserResponse user = new UserResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.getPuedeCrearEncuestas(),
                usuario.getActivo()
        );

        return new LoginResponse(token, user);
    }
}