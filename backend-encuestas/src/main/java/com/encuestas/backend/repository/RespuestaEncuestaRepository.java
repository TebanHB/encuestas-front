package com.encuestas.backend.repository;

import com.encuestas.backend.model.RespuestaEncuesta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RespuestaEncuestaRepository extends JpaRepository<RespuestaEncuesta, Long> {

    List<RespuestaEncuesta> findByEncuestaIdOrderByFechaRespuestaDesc(Long encuestaId);

    long countByEncuestaId(Long encuestaId);

    List<RespuestaEncuesta> findTop5ByOrderByFechaRespuestaDesc();

    List<RespuestaEncuesta> findByUsuarioIdOrderByFechaRespuestaDesc(Long usuarioId);

    long countByUsuarioId(Long usuarioId);

    boolean existsByEncuestaIdAndUsuarioId(Long encuestaId, Long usuarioId);

    List<RespuestaEncuesta> findByUsuarioId(Long usuarioId);

    boolean existsByEncuestaId(Long encuestaId);
}