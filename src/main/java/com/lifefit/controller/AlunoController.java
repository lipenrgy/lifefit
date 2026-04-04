package com.lifefit.controller;

import com.lifefit.model.Plano;
import com.lifefit.model.Usuario;
import com.lifefit.repository.PlanoRepository;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class AlunoController {

    private final UsuarioRepository usuarioRepository;
    private final PlanoRepository planoRepository;

    @GetMapping("/aluno/painel")
    public String painel(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        Usuario u = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        model.addAttribute("usuario", u);
        return "painel_aluno";
    }

    // Equivalente ao meu_plano.php + buscar_meu_plano.php
    @GetMapping("/api/aluno/meu-plano")
    @ResponseBody
    public Map<String, Object> meuPlano(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario aluno = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Map<String, Object> response = new HashMap<>();

        // Busca plano do treinador
        String treino = "Aguardando plano do treinador...";
        String dieta = "Aguardando plano do nutricionista...";

        // Busca pelo treinador vinculado
        if (aluno.getMeuTreinadorId() != null) {
            treino = planoRepository
                    .findByAlunoIdAndProfissionalId(aluno.getId(), aluno.getMeuTreinadorId())
                    .map(Plano::getTreino)
                    .filter(t -> t != null && !t.isBlank())
                    .orElse("Aguardando plano do treinador...");
        }

        // Busca pelo nutricionista vinculado
        if (aluno.getMeuNutricionistaId() != null) {
            dieta = planoRepository
                    .findByAlunoIdAndProfissionalId(aluno.getId(), aluno.getMeuNutricionistaId())
                    .map(Plano::getDieta)
                    .filter(d -> d != null && !d.isBlank())
                    .orElse("Aguardando plano do nutricionista...");
        }

        response.put("treino", treino);
        response.put("dieta", dieta);
        return response;
    }
}