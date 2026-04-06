package com.lifefit.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "plano_exercicios")
public class PlanoExercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long planoId;
    private Long exercicioId;
    private Integer series;
    private Integer repeticoes;
    private Double peso;
    private Integer ordem;
}