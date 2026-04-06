package com.lifefit.repository;

import com.lifefit.model.PlanoExercicio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlanoExercicioRepository extends JpaRepository<PlanoExercicio, Long> {
    List<PlanoExercicio> findByPlanoIdOrderByOrdemAsc(Long planoId);
    void deleteByPlanoId(Long planoId);
}