package com.lifefit.controller;

import com.lifefit.model.Usuario;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    @GetMapping("/dashboard")
    public String dashboard(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario u = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return switch (u.getTipo()) {
            case "aluno"     -> "redirect:/aluno/painel";
            case "treinador" -> "redirect:/treinador/painel";
            case "nutricionista" -> "redirect:/treinador/painel";
            default          -> "redirect:/login?erro=true";
        };
    }

    @GetMapping("/api/me")
    @ResponseBody
    public Map<String, Object> me(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario u = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return Map.of(
                "status", "success",
                "nome",   u.getNome(),
                "tipo",   u.getTipo()
        );
    }
}