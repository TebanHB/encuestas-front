package com.encuestas.backend.controller;

import com.encuestas.backend.dto.GuardarRespuestaRequest;
import com.encuestas.backend.dto.RespuestaEncuestaResponse;
import com.encuestas.backend.service.RespuestaEncuestaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/respuestas")
public class RespuestaEncuestaController {

    private final RespuestaEncuestaService respuestaEncuestaService;

    public RespuestaEncuestaController(RespuestaEncuestaService respuestaEncuestaService) {
        this.respuestaEncuestaService = respuestaEncuestaService;
    }

    @PostMapping
    public ResponseEntity<?> guardarRespuesta(@Valid @RequestBody GuardarRespuestaRequest request) {
        try {
            RespuestaEncuestaResponse response = respuestaEncuestaService.guardarRespuesta(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}