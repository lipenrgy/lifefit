package com.lifefit.repository;

import com.lifefit.model.Plano;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlanoRepository extends JpaRepository<Plano, Long> {
    Optional<Plano> findByAlunoIdAndProfissionalId(Long alunoId, Long profissionalId);
    Optional<Plano> findByAlunoId(Long alunoId);
}