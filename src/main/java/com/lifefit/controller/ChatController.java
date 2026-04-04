package com.lifefit.controller;

import com.lifefit.model.Mensagem;
import com.lifefit.model.Usuario;
import com.lifefit.repository.MensagemRepository;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final UsuarioRepository usuarioRepository;
    private final MensagemRepository mensagemRepository;

    @GetMapping("/chat")
    public String chatPage(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        Usuario u = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        model.addAttribute("usuario", u);
        return "chat";
    }

    // Equivalente ao buscar_contatos_chat.php
    @GetMapping("/api/chat/contatos")
    @ResponseBody
    public List<Map<String, Object>> buscarContatos(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario eu = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Usuario> contatos = new ArrayList<>();

        if (eu.getTipo().equals("aluno")) {
            if (eu.getMeuTreinadorId() != null)
                usuarioRepository.findById(eu.getMeuTreinadorId()).ifPresent(contatos::add);
            if (eu.getMeuNutricionistaId() != null)
                usuarioRepository.findById(eu.getMeuNutricionistaId()).ifPresent(contatos::add);
        } else if (eu.getTipo().equals("treinador")) {
            contatos = usuarioRepository.findByTipoAndMeuTreinadorIdOrderByNomeAsc("aluno", eu.getId());
        } else {
            contatos = usuarioRepository.findByTipoAndMeuNutricionistaIdOrderByNomeAsc("aluno", eu.getId());
        }

        return contatos.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("nome", c.getNome());
            map.put("tipo", c.getTipo());
            map.put("foto", c.getFoto() != null ? "/uploads/" + c.getFoto() : null);
            return map;
        }).toList();
    }

    // Equivalente ao buscar_conversa.php
    @GetMapping("/api/chat/conversa")
    @ResponseBody
    public List<Map<String, Object>> buscarConversa(
            @RequestParam Long idContato,
            @AuthenticationPrincipal UserDetails userDetails) {

        Usuario eu = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Mensagem> msgs = mensagemRepository.findConversa(eu.getId(), idContato);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        return msgs.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id_remetente", m.getIdRemetente());
            map.put("mensagem", m.getMensagem());
            map.put("hora", m.getDataEnvio() != null ? m.getDataEnvio().format(fmt) : "");
            return map;
        }).toList();
    }

    // Equivalente ao enviar_mensagem.php
    @PostMapping("/api/chat/enviar")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> enviarMensagem(
            @RequestParam Long idDestinatario,
            @RequestParam String mensagem,
            @AuthenticationPrincipal UserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();
        Usuario eu = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (mensagem.isBlank()) {
            response.put("status", "error");
            return ResponseEntity.ok(response);
        }

        Mensagem msg = new Mensagem();
        msg.setIdRemetente(eu.getId());
        msg.setIdDestinatario(idDestinatario);
        msg.setMensagem(mensagem);
        msg.setDataEnvio(LocalDateTime.now());
        mensagemRepository.save(msg);

        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
}