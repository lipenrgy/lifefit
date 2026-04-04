package com.lifefit.controller;

import com.lifefit.model.Plano;
import com.lifefit.model.Usuario;
import com.lifefit.repository.PlanoRepository;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
public class TreinadorController {

    private final UsuarioRepository usuarioRepository;
    private final PlanoRepository planoRepository;

    @GetMapping("/treinador/painel")
    public String painel(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        Usuario u = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        model.addAttribute("usuario", u);
        return "painel_treinador";
    }

    @GetMapping("/api/treinador/alunos")
    @ResponseBody
    public List<Map<String, Object>> buscarAlunos(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario profissional = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Usuario> alunos;

        if (profissional.getTipo().equals("treinador")) {
            alunos = usuarioRepository.findByTipoAndMeuTreinadorIdOrderByNomeAsc("aluno", profissional.getId());
        } else {
            alunos = usuarioRepository.findByTipoAndMeuNutricionistaIdOrderByNomeAsc("aluno", profissional.getId());
        }

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Usuario a : alunos) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("nome", a.getNome());
            resultado.add(map);
        }
        return resultado;
    }

    @GetMapping("/api/treinador/plano")
    @ResponseBody
    public Map<String, Object> buscarPlano(
            @RequestParam Long alunoId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Usuario profissional = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Map<String, Object> response = new HashMap<>();
        planoRepository.findByAlunoIdAndProfissionalId(alunoId, profissional.getId())
                .ifPresentOrElse(p -> {
                    response.put("treino", p.getTreino() != null ? p.getTreino() : "");
                    response.put("dieta",  p.getDieta()  != null ? p.getDieta()  : "");
                }, () -> {
                    response.put("treino", "");
                    response.put("dieta", "");
                });
        return response;
    }

    @PostMapping("/api/treinador/salvar-plano")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> salvarPlano(
            @RequestParam Long alunoId,
            @RequestParam(required = false, defaultValue = "") String treino,
            @RequestParam(required = false, defaultValue = "") String dieta,
            @AuthenticationPrincipal UserDetails userDetails) {

        Usuario profissional = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Plano plano = planoRepository
                .findByAlunoIdAndProfissionalId(alunoId, profissional.getId())
                .orElse(new Plano());

        plano.setAlunoId(alunoId);
        plano.setProfissionalId(profissional.getId());

        if (profissional.getTipo().equals("treinador")) {
            plano.setTreino(treino);
        } else {
            plano.setDieta(dieta);
        }

        planoRepository.save(plano);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Plano salvo com sucesso!");
        return ResponseEntity.ok(response);
    }
}