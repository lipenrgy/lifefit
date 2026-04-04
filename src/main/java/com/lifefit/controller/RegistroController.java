package com.lifefit.controller;

import com.lifefit.model.Usuario;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class RegistroController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/registrar")
    public String registrar(
            @RequestParam String nome,
            @RequestParam String email,
            @RequestParam String senha,
            @RequestParam(defaultValue = "aluno") String tipo,
            RedirectAttributes redirectAttributes) {

        // Validação — equivalente ao if (empty(...)) do PHP
        if (nome.isBlank() || email.isBlank() || senha.isBlank()) {
            redirectAttributes.addFlashAttribute("erro", "Todos os campos são obrigatórios.");
            return "redirect:/login";
        }

        // Verifica email duplicado — equivalente ao errno 1062 do PHP
        if (usuarioRepository.findByEmail(email).isPresent()) {
            redirectAttributes.addFlashAttribute("erro", "Este email já está cadastrado.");
            return "redirect:/login";
        }

        // Criptografa a senha — equivalente ao password_hash() do PHP
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setTipo(tipo);

        usuarioRepository.save(usuario);

        redirectAttributes.addFlashAttribute("sucesso", "Usuário registrado com sucesso! Faça login.");
        return "redirect:/login";
    }
}