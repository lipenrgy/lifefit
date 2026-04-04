package com.lifefit.controller;

import com.lifefit.model.Usuario;
import com.lifefit.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
@RequiredArgsConstructor
public class UploadController {

    private final UsuarioRepository usuarioRepository;

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    @PostMapping("/api/upload-foto")
    public String uploadFoto(
            @RequestParam("foto_perfil") MultipartFile arquivo,
            @AuthenticationPrincipal UserDetails userDetails,
            RedirectAttributes redirectAttributes) {

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (arquivo.isEmpty()) {
            redirectAttributes.addFlashAttribute("erro", "Nenhum arquivo enviado.");
            return redirectDestino(usuario.getTipo());
        }

        String nomeOriginal = arquivo.getOriginalFilename();
        String extensao = nomeOriginal != null
                ? nomeOriginal.substring(nomeOriginal.lastIndexOf(".") + 1).toLowerCase()
                : "";

        if (!extensao.equals("jpg") && !extensao.equals("jpeg") && !extensao.equals("png")) {
            redirectAttributes.addFlashAttribute("erro", "Apenas JPG e PNG são aceitos.");
            return redirectDestino(usuario.getTipo());
        }

        String novoNome = "perfil_" + usuario.getId() + "." + extensao;

        try {
            Path pastaUpload = Paths.get(UPLOAD_DIR);
            if (!Files.exists(pastaUpload)) {
                Files.createDirectories(pastaUpload);
            }

            Path destino = pastaUpload.resolve(novoNome);
            arquivo.transferTo(destino.toFile());

            usuario.setFoto(novoNome);
            usuarioRepository.save(usuario);

            redirectAttributes.addFlashAttribute("sucesso", "Foto atualizada com sucesso!");

        } catch (IOException e) {
            redirectAttributes.addFlashAttribute("erro", "Erro ao salvar a foto: " + e.getMessage());
        }

        return redirectDestino(usuario.getTipo());
    }

    private String redirectDestino(String tipo) {
        return switch (tipo.toLowerCase()) {
            case "aluno"         -> "redirect:/aluno/painel";
            case "treinador"     -> "redirect:/treinador/painel";
            case "nutricionista" -> "redirect:/treinador/painel";
            default              -> "redirect:/dashboard";
        };
    }
}