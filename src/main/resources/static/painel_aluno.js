document.addEventListener('DOMContentLoaded', function() {
    const displayTreino = document.getElementById('meu-treino');
    const displayDieta = document.getElementById('minha-dieta');

    fetch('/api/aluno/meu-plano-exercicios')
        .then(r => r.json())
        .then(data => {
            // DIETA
            if (displayDieta) displayDieta.innerText = data.dieta || 'Aguardando plano do nutricionista...';

            // TREINO - renderiza como lista de exercícios
            if (displayTreino) {
                if (!data.exercicios || data.exercicios.length === 0) {
                    displayTreino.innerText = 'Aguardando plano do treinador...';
                    return;
                }

                // Agrupa por categoria
                const grupos = {};
                data.exercicios.forEach(ex => {
                    if (!grupos[ex.categoria]) grupos[ex.categoria] = [];
                    grupos[ex.categoria].push(ex);
                });

                displayTreino.innerHTML = '';
                displayTreino.style.whiteSpace = 'normal';

                Object.entries(grupos).forEach(([cat, exercicios]) => {
                    const catDiv = document.createElement('div');
                    catDiv.style.cssText = 'margin-bottom: 20px;';

                    const catHeader = document.createElement('div');
                    catHeader.style.cssText = `
                        font-size: 0.75rem; font-weight: 700; color: var(--violeta);
                        letter-spacing: 2px; text-transform: uppercase;
                        margin-bottom: 10px; padding-bottom: 6px;
                        border-bottom: 1px solid var(--borda);
                    `;
                    catHeader.textContent = cat;
                    catDiv.appendChild(catHeader);

                    exercicios.forEach(ex => {
                        const item = document.createElement('div');
                        item.style.cssText = `
                            display: flex; align-items: center; justify-content: space-between;
                            padding: 10px 14px; margin-bottom: 8px;
                            background: var(--fundo-primario);
                            border-radius: 12px; border: 1px solid var(--borda);
                        `;
                        item.innerHTML = `
                            <span style="font-size:0.9rem;font-weight:600;color:var(--texto-primario);">
                                ${ex.nome}
                            </span>
                            <span style="
                                font-size:0.82rem; font-weight:700; color: var(--violeta);
                                background: var(--violeta-claro); padding: 4px 12px;
                                border-radius: 50px;
                            ">
                                ${ex.series}×${ex.repeticoes}${ex.peso > 0 ? ' · ' + ex.peso + 'kg' : ''}
                            </span>
                        `;
                        catDiv.appendChild(item);
                    });

                    displayTreino.appendChild(catDiv);
                });
            }
        })
        .catch(error => {
            console.error('Erro ao buscar plano:', error);
            if (displayTreino) displayTreino.innerText = 'Erro ao carregar treino.';
            if (displayDieta) displayDieta.innerText = 'Erro ao carregar dieta.';
        });
});