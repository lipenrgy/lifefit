package com.lifefit.controller;

import com.lifefit.model.*;
import com.lifefit.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import jakarta.transaction.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class TreinadorController {

    private final UsuarioRepository usuarioRepository;
    private final PlanoRepository planoRepository;
    private final ExercicioRepository exercicioRepository;
    private final PlanoExercicioRepository planoExercicioRepository;

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

    // Busca todos os exercícios agrupados por categoria
    @GetMapping("/api/treinador/exercicios")
    @ResponseBody
    public Map<String, List<Map<String, Object>>> buscarExercicios(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) String categoria) {

        List<Exercicio> exercicios;
        if (busca != null && !busca.isBlank()) {
            exercicios = exercicioRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc(busca);
        } else if (categoria != null && !categoria.isBlank() && !categoria.equals("Todos")) {
            exercicios = exercicioRepository.findByCategoriaOrderByNomeAsc(categoria);
        } else {
            exercicios = exercicioRepository.findAllByOrderByCategoriaAscNomeAsc();
        }

        Map<String, List<Map<String, Object>>> agrupado = new LinkedHashMap<>();
        for (Exercicio e : exercicios) {
            agrupado.computeIfAbsent(e.getCategoria(), k -> new ArrayList<>())
                    .add(Map.of("id", e.getId(), "nome", e.getNome(), "categoria", e.getCategoria()));
        }
        return agrupado;
    }

    // Busca exercícios do plano de um aluno
    @GetMapping("/api/treinador/plano-exercicios")
    @ResponseBody
    public List<Map<String, Object>> buscarPlanoExercicios(
            @RequestParam Long alunoId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Usuario profissional = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Plano plano = planoRepository.findByAlunoIdAndProfissionalId(alunoId, profissional.getId())
                .orElse(null);

        if (plano == null) return new ArrayList<>();

        List<PlanoExercicio> itens = planoExercicioRepository.findByPlanoIdOrderByOrdemAsc(plano.getId());
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (PlanoExercicio pe : itens) {
            exercicioRepository.findById(pe.getExercicioId()).ifPresent(ex -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", pe.getId());
                map.put("exercicioId", ex.getId());
                map.put("nome", ex.getNome());
                map.put("categoria", ex.getCategoria());
                map.put("series", pe.getSeries());
                map.put("repeticoes", pe.getRepeticoes());
                map.put("peso", pe.getPeso());
                resultado.add(map);
            });
        }
        return resultado;
    }

    // Salva plano completo de exercícios
    @PostMapping("/api/treinador/salvar-plano-exercicios")
    @ResponseBody
    @Transactional
    public ResponseEntity<Map<String, Object>> salvarPlanoExercicios(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();
        Usuario profissional = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Long alunoId = Long.valueOf(body.get("alunoId").toString());

        Plano plano = planoRepository.findByAlunoIdAndProfissionalId(alunoId, profissional.getId())
                .orElse(new Plano());

        plano.setAlunoId(alunoId);
        plano.setProfissionalId(profissional.getId());
        planoRepository.save(plano);

        // Remove exercícios antigos e salva os novos
        planoExercicioRepository.deleteByPlanoId(plano.getId());

        List<Map<String, Object>> exercicios = (List<Map<String, Object>>) body.get("exercicios");
        int ordem = 0;
        for (Map<String, Object> ex : exercicios) {
            PlanoExercicio pe = new PlanoExercicio();
            pe.setPlanoId(plano.getId());
            pe.setExercicioId(Long.valueOf(ex.get("exercicioId").toString()));
            pe.setSeries(Integer.valueOf(ex.get("series").toString()));
            pe.setRepeticoes(Integer.valueOf(ex.get("repeticoes").toString()));
            pe.setPeso(Double.valueOf(ex.get("peso").toString()));
            pe.setOrdem(ordem++);
            planoExercicioRepository.save(pe);
        }

        response.put("status", "success");
        response.put("message", "Plano salvo com sucesso!");
        return ResponseEntity.ok(response);
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
                    response.put("dieta", p.getDieta() != null ? p.getDieta() : "");
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
        Plano plano = planoRepository.findByAlunoIdAndProfissionalId(alunoId, profissional.getId())
                .orElse(new Plano());
        plano.setAlunoId(alunoId);
        plano.setProfissionalId(profissional.getId());
        if (profissional.getTipo().equals("treinador")) plano.setTreino(treino);
        else plano.setDieta(dieta);
        planoRepository.save(plano);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Plano salvo com sucesso!");
        return ResponseEntity.ok(response);
    }
}