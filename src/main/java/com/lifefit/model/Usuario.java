package com.lifefit.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String email;
    private String senha;
    private String tipo;
    private Long meuTreinadorId;
    private Long meuNutricionistaId;
    private String foto;

    // Dados físicos do aluno
    private Double peso;
    private Integer alturaCm;
    private Integer idade;
    private String nivelAtividade;
}