package com.lifefit.repository;

import com.lifefit.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    List<Usuario> findByTipoAndMeuTreinadorIdOrderByNomeAsc(String tipo, Long treinadorId);
    List<Usuario> findByTipoAndMeuNutricionistaIdOrderByNomeAsc(String tipo, Long nutricionistaId);
    List<Usuario> findByTipoInOrderByTipoDesc(List<String> tipos);

}