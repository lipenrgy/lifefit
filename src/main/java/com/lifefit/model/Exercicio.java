package com.lifefit.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "exercicios")
public class Exercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String categoria;
    private String descricao;
}