package com.lifefit.controller;

import com.lifefit.model.Usuario;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class IndexController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping("/")
    public String index(@AuthenticationPrincipal UserDetails userDetails, Model model) {

        // Busca profissionais para o carrossel
        List<Usuario> profissionais = usuarioRepository.findByTipoInOrderByTipoDesc(
                List.of("treinador", "nutricionista")
        );
        model.addAttribute("profissionais", profissionais);

        // Se estiver logado, passa dados do usuário
        if (userDetails != null) {
            Usuario u = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            model.addAttribute("usuario", u);
            model.addAttribute("estaLogado", true);
        } else {
            model.addAttribute("estaLogado", false);
        }

        return "index";
    }
}