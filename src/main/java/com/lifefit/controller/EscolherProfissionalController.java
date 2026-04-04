package com.lifefit.controller;

import com.lifefit.model.Usuario;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class EscolherProfissionalController {

    private final UsuarioRepository usuarioRepository;

    @PostMapping("/api/escolher-profissional")
    public ResponseEntity<Map<String, Object>> escolherProfissional(
            @RequestParam Long id_profissional,
            @RequestParam String tipo_profissional,
            @AuthenticationPrincipal UserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();

        // Verifica se é aluno
        Usuario aluno = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        if (!aluno.getTipo().equals("aluno")) {
            response.put("status", "error");
            response.put("message", "Você precisa estar logado como Aluno.");
            return ResponseEntity.ok(response);
        }

        // Define qual campo atualizar
        String tipo = tipo_profissional.toLowerCase();
        if (tipo.equals("treinador")) {
            aluno.setMeuTreinadorId(id_profissional);
        } else if (tipo.equals("nutricionista")) {
            aluno.setMeuNutricionistaId(id_profissional);
        } else {
            response.put("status", "error");
            response.put("message", "Tipo inválido: " + tipo_profissional);
            return ResponseEntity.ok(response);
        }

        usuarioRepository.save(aluno);
        response.put("status", "success");
        response.put("message", "Profissional escolhido com sucesso!");
        return ResponseEntity.ok(response);
    }
}