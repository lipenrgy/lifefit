document.addEventListener('DOMContentLoaded', function () {
    const ehTreinador = document.getElementById('tipo-usuario-logado').value === 'treinador';
    const listaAlunosUL = document.getElementById('alunos-ul');
    const nomeAlunoTitulo = document.getElementById('aluno-selecionado-nome');
    const formPlano = document.getElementById('form-plano');
    const placeholderPlano = document.getElementById('placeholder-plano');
    const inputAlunoId = document.getElementById('aluno-id-hidden');
    const dadosGrid = document.getElementById('dados-aluno-grid');
    const statusPlano = document.getElementById('status-plano');
    const btnSalvar = document.getElementById('btn-salvar-plano');

    const STATUS_PADRAO = 'As mudanças só valem para o aluno depois de salvar.';

    let planoAtual = [];
    let catalogoAtual = {};
    let alunoSelecionadoId = null;
    let alterado = false;
    let ultimoAdicionado = null;

    function getCsrfToken() {
        return document.querySelector('meta[name="_csrf"]')?.getAttribute('content') || '';
    }
    function getCsrfHeader() {
        return document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content') || 'X-CSRF-TOKEN';
    }

    function escapar(texto) {
        const div = document.createElement('div');
        div.textContent = texto == null ? '' : String(texto);
        return div.innerHTML;
    }

    function buscarJson(url, opcoes) {
        return fetch(url, opcoes).then(r => {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        });
    }

    function marcarAlterado() {
        alterado = true;
        statusPlano.textContent = 'Alterações não salvas.';
    }

    // ===== ALUNOS =====
    function carregarAlunos() {
        buscarJson('/api/treinador/alunos')
            .then(data => {
                listaAlunosUL.innerHTML = '';
                if (data.length === 0) {
                    listaAlunosUL.innerHTML = '<li class="sem-alunos">Nenhum aluno escolheu você ainda. Eles aparecem aqui quando escolherem você na página inicial.</li>';
                    return;
                }
                data.forEach(aluno => {
                    const li = document.createElement('li');
                    li.textContent = aluno.nome;
                    li.dataset.id = aluno.id;
                    li.tabIndex = 0;
                    li.setAttribute('role', 'button');
                    li.addEventListener('click', () => trocarAluno(li));
                    li.addEventListener('keydown', e => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trocarAluno(li); }
                    });
                    listaAlunosUL.appendChild(li);
                });
            })
            .catch(() => {
                listaAlunosUL.innerHTML = '<li class="sem-alunos">Não foi possível carregar seus alunos. Recarregue a página.</li>';
            });
    }

    function trocarAluno(li) {
        if (li.dataset.id === alunoSelecionadoId) return;
        if (alterado && !confirm('Você tem alterações não salvas. Trocar de aluno mesmo assim?')) return;
        listaAlunosUL.querySelectorAll('li').forEach(i => i.classList.remove('active'));
        li.classList.add('active');
        selecionarAluno(li.dataset.id, li.textContent);
    }

    function selecionarAluno(id, nome) {
        alunoSelecionadoId = id;
        inputAlunoId.value = id;
        alterado = false;
        statusPlano.textContent = STATUS_PADRAO;
        nomeAlunoTitulo.textContent = ehTreinador ? `Ficha de ${nome}` : `Plano alimentar de ${nome}`;

        formPlano.classList.remove('hidden');
        placeholderPlano.classList.add('hidden');

        carregarDadosFisicos(id);

        if (ehTreinador) {
            buscarJson(`/api/treinador/plano-exercicios?alunoId=${id}`)
                .then(data => { planoAtual = data; renderizarPlano(); renderizarExercicios(); });
            document.getElementById('busca-exercicio').disabled = false;
            document.getElementById('filtro-categoria').disabled = false;
            carregarExercicios();
        } else {
            const textarea = document.getElementById('dieta-texto');
            textarea.value = '';
            buscarJson(`/api/treinador/plano?alunoId=${id}`)
                .then(data => { textarea.value = data.dieta || ''; });
        }
    }

    function carregarDadosFisicos(id) {
        buscarJson(`/api/treinador/dados-aluno?alunoId=${id}`)
            .then(dados => {
                const itens = [
                    ['Peso', dados.peso ? `${String(dados.peso).replace('.', ',')} kg` : '—'],
                    ['Altura', dados.alturaCm ? `${dados.alturaCm} cm` : '—'],
                    ['Idade', dados.idade ? `${dados.idade} anos` : '—'],
                    ['IMC', dados.imc ? dados.imc.replace('.', ',') : '—'],
                    ['Atividade', dados.nivelAtividade || '—']
                ];
                dadosGrid.innerHTML = itens
                    .map(([rotulo, valor]) => `<div><dt>${rotulo}</dt><dd>${escapar(valor)}</dd></div>`)
                    .join('');
                dadosGrid.classList.remove('hidden');
            })
            .catch(() => dadosGrid.classList.add('hidden'));
    }

    // ===== FICHA (só treinador) =====
    function renderizarPlano() {
        const container = document.getElementById('plano-atual');

        if (planoAtual.length === 0) {
            container.innerHTML = '<p class="placeholder-col">A ficha está vazia. Adicione exercícios pela lista ao lado.</p>';
            return;
        }

        const grupos = {};
        planoAtual.forEach((ex, idx) => {
            (grupos[ex.categoria] = grupos[ex.categoria] || []).push({ ex, idx });
        });

        let linhas = '';
        Object.entries(grupos).forEach(([cat, itens]) => {
            linhas += `<tr class="ficha-grupo" data-grupo="${escapar(cat)}"><th colspan="5" scope="rowgroup">${escapar(cat)}</th></tr>`;
            itens.forEach(({ ex, idx }) => {
                const nova = ex.exercicioId === ultimoAdicionado ? ' class="linha-nova"' : '';
                const nome = escapar(ex.nome);
                linhas += `
                    <tr${nova}>
                        <td>${nome}</td>
                        <td><input type="number" class="config-input" value="${escapar(ex.series)}" min="1" max="20"
                                   aria-label="Séries de ${nome}" data-idx="${idx}" data-campo="series"></td>
                        <td><input type="number" class="config-input" value="${escapar(ex.repeticoes)}" min="1" max="100"
                                   aria-label="Repetições de ${nome}" data-idx="${idx}" data-campo="repeticoes"></td>
                        <td><input type="number" class="config-input" value="${escapar(ex.peso)}" min="0" step="0.5"
                                   aria-label="Carga em kg de ${nome}" data-idx="${idx}" data-campo="peso"></td>
                        <td><button type="button" class="btn-remover-ex" data-remover="${idx}"
                                    aria-label="Remover ${nome}">Remover</button></td>
                    </tr>`;
            });
        });
        ultimoAdicionado = null;

        container.innerHTML = `
            <div class="ficha ficha-editavel">
                <table class="ficha-tabela">
                    <thead>
                        <tr>
                            <th scope="col">Exercício</th><th scope="col">Séries</th><th scope="col">Reps</th>
                            <th scope="col">Carga (kg)</th><th scope="col"><span class="visualmente-oculto">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>`;
    }

    const planoContainer = document.getElementById('plano-atual');
    if (planoContainer) {
        planoContainer.addEventListener('change', e => {
            const input = e.target.closest('input[data-campo]');
            if (!input) return;
            const { idx, campo } = input.dataset;
            planoAtual[idx][campo] = campo === 'peso' ? parseFloat(input.value) || 0 : parseInt(input.value) || 0;
            marcarAlterado();
        });
        planoContainer.addEventListener('click', e => {
            const botao = e.target.closest('[data-remover]');
            if (!botao) return;
            planoAtual.splice(Number(botao.dataset.remover), 1);
            marcarAlterado();
            renderizarPlano();
            renderizarExercicios();
        });
    }

    // ===== CATÁLOGO DE EXERCÍCIOS (só treinador) =====
    function carregarExercicios(busca = '', categoria = 'Todos') {
        let url = '/api/treinador/exercicios?';
        if (busca) url += `busca=${encodeURIComponent(busca)}&`;
        if (categoria !== 'Todos') url += `categoria=${encodeURIComponent(categoria)}`;

        buscarJson(url).then(data => { catalogoAtual = data; renderizarExercicios(); });
    }

    function renderizarExercicios() {
        const container = document.getElementById('lista-exercicios');
        if (!container) return;
        container.innerHTML = '';

        if (Object.values(catalogoAtual).flat().length === 0) {
            container.innerHTML = '<p class="placeholder-col">Nenhum exercício encontrado com esse nome ou grupo.</p>';
            return;
        }

        const naFicha = new Set(planoAtual.map(e => e.exercicioId));

        Object.entries(catalogoAtual).forEach(([categoria, exercicios]) => {
            const titulo = document.createElement('div');
            titulo.className = 'ex-grupo-titulo';
            titulo.dataset.grupo = categoria;
            titulo.textContent = categoria;
            container.appendChild(titulo);

            exercicios.forEach(ex => {
                const jaEsta = naFicha.has(ex.id);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ex-item-btn';
                btn.innerHTML = `<span>${escapar(ex.nome)}</span><span class="ex-add">${jaEsta ? 'Na ficha' : 'Adicionar'}</span>`;
                if (jaEsta) btn.setAttribute('aria-disabled', 'true');
                else btn.addEventListener('click', () => adicionarExercicio(ex));
                container.appendChild(btn);
            });
        });
    }

    function adicionarExercicio(ex) {
        if (!alunoSelecionadoId || planoAtual.some(e => e.exercicioId === ex.id)) return;
        planoAtual.push({ exercicioId: ex.id, nome: ex.nome, categoria: ex.categoria, series: 3, repeticoes: 12, peso: 0 });
        ultimoAdicionado = ex.id;
        marcarAlterado();
        renderizarPlano();
        renderizarExercicios();
    }

    if (ehTreinador) {
        const busca = document.getElementById('busca-exercicio');
        const filtro = document.getElementById('filtro-categoria');
        busca.addEventListener('input', () => carregarExercicios(busca.value, filtro.value));
        filtro.addEventListener('change', () => carregarExercicios(busca.value, filtro.value));
    } else {
        document.getElementById('dieta-texto').addEventListener('input', marcarAlterado);
    }

    // ===== SALVAR =====
    btnSalvar.addEventListener('click', function () {
        if (!alunoSelecionadoId) return;

        const headers = {};
        headers[getCsrfHeader()] = getCsrfToken();
        let requisicao;

        if (ehTreinador) {
            if (planoAtual.length === 0) {
                statusPlano.textContent = 'Adicione pelo menos um exercício antes de salvar.';
                return;
            }
            headers['Content-Type'] = 'application/json';
            requisicao = buscarJson('/api/treinador/salvar-plano-exercicios', {
                method: 'POST', headers,
                body: JSON.stringify({ alunoId: alunoSelecionadoId, exercicios: planoAtual })
            });
        } else {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            requisicao = buscarJson('/api/treinador/salvar-plano', {
                method: 'POST', headers,
                body: new URLSearchParams({ alunoId: alunoSelecionadoId, dieta: document.getElementById('dieta-texto').value })
            });
        }

        btnSalvar.disabled = true;
        statusPlano.textContent = 'Salvando…';

        requisicao
            .then(data => {
                if (data.status !== 'success') throw new Error(data.message);
                alterado = false;
                statusPlano.textContent = ehTreinador
                    ? 'Ficha salva. O aluno já vê a versão nova.'
                    : 'Plano alimentar salvo. O aluno já vê a versão nova.';
            })
            .catch(() => {
                statusPlano.textContent = ehTreinador
                    ? 'Não foi possível salvar. Confira séries, repetições e carga e tente de novo.'
                    : 'Não foi possível salvar. Verifique sua conexão e tente de novo.';
            })
            .finally(() => { btnSalvar.disabled = false; });
    });

    window.addEventListener('beforeunload', e => {
        if (alterado) e.preventDefault();
    });

    carregarAlunos();
});
