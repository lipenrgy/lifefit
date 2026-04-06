package com.lifefit.controller;

import com.lifefit.model.Plano;
import com.lifefit.model.PlanoExercicio;
import com.lifefit.model.Usuario;
import com.lifefit.repository.ExercicioRepository;
import com.lifefit.repository.PlanoExercicioRepository;
import com.lifefit.repository.PlanoRepository;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class AlunoController {

    private final UsuarioRepository usuarioRepository;
    private final PlanoRepository planoRepository;
    private final ExercicioRepository exercicioRepository;
    private final PlanoExercicioRepository planoExercicioRepository;

    @GetMapping("/aluno/painel")
    public String painel(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        Usuario u = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        model.addAttribute("usuario", u);
        return "painel_aluno";
    }

    @GetMapping("/api/aluno/meu-plano")
    @ResponseBody
    public Map<String, Object> meuPlano(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario aluno = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Map<String, Object> response = new HashMap<>();

        String treino = "Aguardando plano do treinador...";
        String dieta = "Aguardando plano do nutricionista...";

        if (aluno.getMeuTreinadorId() != null) {
            treino = planoRepository
                    .findByAlunoIdAndProfissionalId(aluno.getId(), aluno.getMeuTreinadorId())
                    .map(Plano::getTreino)
                    .filter(t -> t != null && !t.isBlank())
                    .orElse("Aguardando plano do treinador...");
        }

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

    @GetMapping("/api/aluno/meu-plano-exercicios")
    @ResponseBody
    public Map<String, Object> meuPlanoExercicios(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario aluno = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Map<String, Object> response = new HashMap<>();

        List<Map<String, Object>> exercicios = new ArrayList<>();
        String dieta = "Aguardando plano do nutricionista...";

        if (aluno.getMeuTreinadorId() != null) {
            planoRepository.findByAlunoIdAndProfissionalId(aluno.getId(), aluno.getMeuTreinadorId())
                    .ifPresent(plano -> {
                        List<PlanoExercicio> itens = planoExercicioRepository
                                .findByPlanoIdOrderByOrdemAsc(plano.getId());
                        for (PlanoExercicio pe : itens) {
                            exercicioRepository.findById(pe.getExercicioId()).ifPresent(ex -> {
                                Map<String, Object> map = new HashMap<>();
                                map.put("nome", ex.getNome());
                                map.put("categoria", ex.getCategoria());
                                map.put("series", pe.getSeries());
                                map.put("repeticoes", pe.getRepeticoes());
                                map.put("peso", pe.getPeso());
                                exercicios.add(map);
                            });
                        }
                    });
        }

        if (aluno.getMeuNutricionistaId() != null) {
            dieta = planoRepository
                    .findByAlunoIdAndProfissionalId(aluno.getId(), aluno.getMeuNutricionistaId())
                    .map(Plano::getDieta)
                    .filter(d -> d != null && !d.isBlank())
                    .orElse("Aguardando plano do nutricionista...");
        }

        response.put("exercicios", exercicios);
        response.put("dieta", dieta);
        return response;
    }
}