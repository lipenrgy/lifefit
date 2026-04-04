package com.lifefit.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "planos")
public class Plano {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long alunoId;
    private Long profissionalId;

    @Column(columnDefinition = "TEXT")
    private String treino;

    @Column(columnDefinition = "TEXT")
    private String dieta;
}