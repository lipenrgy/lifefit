document.addEventListener('DOMContentLoaded', function () {
    const displayTreino = document.getElementById('meu-treino');
    const displayDieta = document.getElementById('minha-dieta');
    const temTreinador = displayTreino.dataset.temTreinador === 'true';
    const temNutricionista = displayDieta.dataset.temNutricionista === 'true';

    function escapar(texto) {
        const div = document.createElement('div');
        div.textContent = texto == null ? '' : String(texto);
        return div.innerHTML;
    }

    function mostrarAviso(el, html) {
        el.innerHTML = `<p class="ficha-vazia">${html}</p>`;
    }

    function formatarCarga(peso) {
        return peso > 0 ? `${String(peso).replace('.', ',')} kg` : '—';
    }

    fetch('/api/aluno/meu-plano-exercicios')
        .then(r => {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        })
        .then(data => {
            // DIETA — texto livre escrito pelo nutricionista
            if (!temNutricionista) {
                displayDieta.innerHTML = 'Você ainda não escolheu um nutricionista. <a href="/#profissionais">Escolher na página inicial</a>.';
                displayDieta.classList.add('texto-espera');
            } else if (!data.dieta || data.dieta.startsWith('Aguardando')) {
                displayDieta.textContent = 'Seu nutricionista ainda não enviou o plano. Ele aparece aqui assim que for salvo.';
                displayDieta.classList.add('texto-espera');
            } else {
                displayDieta.textContent = data.dieta;
            }

            // TREINO — ficha agrupada por grupo muscular
            if (!temTreinador) {
                mostrarAviso(displayTreino, 'Você ainda não escolheu um treinador. <a href="/#profissionais">Escolher na página inicial</a>.');
                return;
            }
            if (!data.exercicios || data.exercicios.length === 0) {
                mostrarAviso(displayTreino, 'Seu treinador ainda não montou sua ficha. Se quiser, mande uma mensagem pelo <a href="/chat">chat</a>.');
                return;
            }

            const grupos = {};
            data.exercicios.forEach(ex => {
                (grupos[ex.categoria] = grupos[ex.categoria] || []).push(ex);
            });

            let linhas = '';
            Object.entries(grupos).forEach(([cat, exercicios]) => {
                linhas += `<tr class="ficha-grupo" data-grupo="${escapar(cat)}"><th colspan="4" scope="rowgroup">${escapar(cat)}</th></tr>`;
                exercicios.forEach(ex => {
                    linhas += `
                        <tr>
                            <td>${escapar(ex.nome)}</td>
                            <td class="ficha-num">${escapar(ex.series)}</td>
                            <td class="ficha-num">${escapar(ex.repeticoes)}</td>
                            <td class="ficha-num">${escapar(formatarCarga(ex.peso))}</td>
                        </tr>`;
                });
            });

            displayTreino.innerHTML = `
                <table class="ficha-tabela">
                    <thead>
                        <tr><th scope="col">Exercício</th><th scope="col">Séries</th><th scope="col">Reps</th><th scope="col">Carga</th></tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>`;
        })
        .catch(() => {
            mostrarAviso(displayTreino, 'Não foi possível carregar sua ficha. Recarregue a página para tentar de novo.');
            displayDieta.textContent = 'Não foi possível carregar seu plano alimentar.';
            displayDieta.classList.add('texto-espera');
        });
});
