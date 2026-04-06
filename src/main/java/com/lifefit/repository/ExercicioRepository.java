package com.lifefit.repository;

import com.lifefit.model.Exercicio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExercicioRepository extends JpaRepository<Exercicio, Long> {
    List<Exercicio> findByCategoriaOrderByNomeAsc(String categoria);
    List<Exercicio> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
    List<Exercicio> findAllByOrderByCategoriaAscNomeAsc();
}