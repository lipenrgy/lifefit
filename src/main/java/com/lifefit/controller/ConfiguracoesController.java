package com.lifefit.controller;

import com.lifefit.model.Usuario;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ConfiguracoesController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/configuracoes")
    public String pagina(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        Usuario u = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        model.addAttribute("usuario", u);
        return "configuracoes";
    }

    @PostMapping("/api/atualizar-perfil")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> atualizarPerfil(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false, defaultValue = "") String nova_senha,
            @AuthenticationPrincipal UserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        // 1. Atualizar nome
        if (nome != null && !nome.isBlank()) {
            usuario.setNome(nome);
        }

        // 2. Atualizar senha
        if (!nova_senha.isBlank()) {
            // Verifica se nova senha é igual à atual
            if (passwordEncoder.matches(nova_senha, usuario.getSenha())) {
                response.put("status", "error");
                response.put("message", "A nova senha não pode ser igual à atual!");
                return ResponseEntity.ok(response);
            }
            usuario.setSenha(passwordEncoder.encode(nova_senha));
        }

        usuarioRepository.save(usuario);
        response.put("status", "success");
        response.put("message", "Dados atualizados com sucesso!");
        return ResponseEntity.ok(response);
    }


    @PostMapping("/api/atualizar-dados-fisicos")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> atualizarDadosFisicos(
            @RequestParam(required = false) Double peso,
            @RequestParam(required = false) Integer alturaCm,
            @RequestParam(required = false) Integer idade,
            @RequestParam(required = false) String nivelAtividade,
            @AuthenticationPrincipal UserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (peso != null) usuario.setPeso(peso);
        if (alturaCm != null) usuario.setAlturaCm(alturaCm);
        if (idade != null) usuario.setIdade(idade);
        if (nivelAtividade != null && !nivelAtividade.isBlank()) usuario.setNivelAtividade(nivelAtividade);

        usuarioRepository.save(usuario);
        response.put("status", "success");
        response.put("message", "Dados físicos atualizados!");
        return ResponseEntity.ok(response);
    }
}