package com.encuestas.backend.repository;

import com.encuestas.backend.model.Encuesta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EncuestaRepository extends JpaRepository<Encuesta, Long> {

    long countByEstado(String estado);

    List<Encuesta> findTop5ByOrderByFechaCreacionDesc();

    List<Encuesta> findByEstadoOrderByFechaCreacionDesc(String estado);

    List<Encuesta> findAllByOrderByFechaCreacionDesc();
}