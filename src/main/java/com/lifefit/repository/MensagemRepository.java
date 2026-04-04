package com.lifefit.repository;

import com.lifefit.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    @Query("SELECT m FROM Mensagem m WHERE " +
            "(m.idRemetente = :eu AND m.idDestinatario = :ele) OR " +
            "(m.idRemetente = :ele AND m.idDestinatario = :eu) " +
            "ORDER BY m.dataEnvio ASC")
    List<Mensagem> findConversa(@Param("eu") Long eu, @Param("ele") Long ele);
}