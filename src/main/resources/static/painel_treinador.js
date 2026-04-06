document.addEventListener('DOMContentLoaded', function () {
    const listaAlunosUL = document.getElementById('alunos-ul');
    const nomeAlunoTitulo = document.getElementById('aluno-selecionado-nome');
    const formPlano = document.getElementById('form-plano');
    const inputAlunoId = document.getElementById('aluno-id-hidden');
    let liAlunos = [];
    let planoAtual = [];
    let alunoSelecionadoId = null;

    function getCsrfToken() {
        return document.querySelector('meta[name="_csrf"]')?.getAttribute('content') || '';
    }
    function getCsrfHeader() {
        return document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content') || 'X-CSRF-TOKEN';
    }

    // ===== CARREGAR ALUNOS =====
    function carregarAlunos() {
        fetch('/api/treinador/alunos')
            .then(r => r.json())
            .then(data => {
                listaAlunosUL.innerHTML = '';
                if (data.length > 0) {
                    data.forEach(aluno => {
                        const li = document.createElement('li');
                        li.textContent = aluno.nome;
                        li.dataset.id = aluno.id;
                        listaAlunosUL.appendChild(li);
                    });
                    liAlunos = document.querySelectorAll('#alunos-ul li');
                    liAlunos.forEach(li => {
                        li.addEventListener('click', function () {
                            liAlunos.forEach(i => i.classList.remove('active'));
                            this.classList.add('active');
                            selecionarAluno(this.dataset.id, this.textContent);
                        });
                    });
                } else {
                    listaAlunosUL.innerHTML = '<li style="color:var(--texto-secundario);font-size:0.88rem;">Nenhum aluno encontrado.</li>';
                }
            });
    }

    // ===== SELECIONAR ALUNO =====
    function selecionarAluno(id, nome) {
        alunoSelecionadoId = id;
        inputAlunoId.value = id;
        nomeAlunoTitulo.textContent = `Treino de ${nome}`;

        // Mostra o form e esconde o placeholder
        document.getElementById('form-plano').style.display = 'flex';
        document.getElementById('placeholder-plano').style.display = 'none';
        // Carrega exercícios do plano deste aluno
        fetch(`/api/treinador/plano-exercicios?alunoId=${id}`)
            .then(r => r.json())
            .then(data => {
                planoAtual = data;
                renderizarPlano();
            });
        // Busca dados físicos do aluno
        fetch(`/api/treinador/dados-aluno?alunoId=${id}`)
            .then(r => r.json())
            .then(dados => {
                const card = document.getElementById('card-dados-aluno');
                const grid = document.getElementById('dados-aluno-grid');
                card.style.display = 'block';

                const itens = [
                    { label: 'Peso', valor: dados.peso ? dados.peso + ' kg' : '—' },
                    { label: 'Altura', valor: dados.alturaCm ? dados.alturaCm + ' cm' : '—' },
                    { label: 'Idade', valor: dados.idade ? dados.idade + ' anos' : '—' },
                    { label: 'IMC', valor: dados.imc ? dados.imc : '—' },
                    { label: 'Nível', valor: dados.nivelAtividade || '—' }
                ];

                grid.innerHTML = itens.map(item => `
            <div style="background:var(--fundo-primario);border-radius:10px;
                        padding:10px 12px;border:1px solid var(--borda);">
                <p style="font-size:0.7rem;color:var(--texto-secundario);margin:0 0 2px;font-weight:600;">
                    ${item.label}
                </p>
                <strong style="font-size:0.9rem;color:var(--violeta);">${item.valor}</strong>
            </div>
        `).join('');
            });

        // Carrega lista de exercícios disponíveis
        carregarExercicios();
    }

    // ===== RENDERIZA PLANO ATUAL =====
    function renderizarPlano() {
        const container = document.getElementById('plano-atual');
        container.innerHTML = '';

        if (planoAtual.length === 0) {
            container.innerHTML = '<p style="color:var(--texto-secundario);font-size:0.88rem;text-align:center;padding:20px;">Nenhum exercício adicionado ainda.</p>';
            return;
        }

        // Agrupa por categoria
        const grupos = {};
        planoAtual.forEach(ex => {
            if (!grupos[ex.categoria]) grupos[ex.categoria] = [];
            grupos[ex.categoria].push(ex);
        });

        Object.entries(grupos).forEach(([cat, exercicios]) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'plano-categoria';
            catDiv.innerHTML = `<div class="plano-cat-header">${getCatIcon(cat)} ${cat}</div>`;

            exercicios.forEach((ex, idx) => {
                const globalIdx = planoAtual.indexOf(ex);
                const item = document.createElement('div');
                item.className = 'plano-exercicio-item';
                item.innerHTML = `
                    <div class="plano-ex-info">
                        <span class="plano-ex-nome">${ex.nome}</span>
                        <div class="plano-ex-config">
                            <div class="config-input-group">
                                <label>Séries</label>
                                <input type="number" class="config-input" value="${ex.series}" min="1" max="20"
                                    onchange="atualizarExercicio(${globalIdx}, 'series', this.value)">
                            </div>
                            <span class="config-sep">×</span>
                            <div class="config-input-group">
                                <label>Reps</label>
                                <input type="number" class="config-input" value="${ex.repeticoes}" min="1" max="100"
                                    onchange="atualizarExercicio(${globalIdx}, 'repeticoes', this.value)">
                            </div>
                            <div class="config-input-group">
                                <label>Peso (kg)</label>
                                <input type="number" class="config-input" value="${ex.peso}" min="0" step="0.5"
                                    onchange="atualizarExercicio(${globalIdx}, 'peso', this.value)">
                            </div>
                        </div>
                    </div>
                    <button class="btn-remover-ex" onclick="removerExercicio(${globalIdx})" title="Remover">✕</button>
                `;
                catDiv.appendChild(item);
            });

            container.appendChild(catDiv);
        });
    }

    window.atualizarExercicio = function(idx, campo, valor) {
        planoAtual[idx][campo] = campo === 'peso' ? parseFloat(valor) : parseInt(valor);
    };

    window.removerExercicio = function(idx) {
        planoAtual.splice(idx, 1);
        renderizarPlano();
    };

    // ===== CARREGAR EXERCÍCIOS DISPONÍVEIS =====
    function carregarExercicios(busca = '', categoria = 'Todos') {
        let url = '/api/treinador/exercicios?';
        if (busca) url += `busca=${encodeURIComponent(busca)}&`;
        if (categoria !== 'Todos') url += `categoria=${encodeURIComponent(categoria)}`;

        fetch(url)
            .then(r => r.json())
            .then(data => renderizarExercicios(data));
    }

    function renderizarExercicios(data) {
        const container = document.getElementById('lista-exercicios');
        container.innerHTML = '';

        const totalExercicios = Object.values(data).flat().length;
        if (totalExercicios === 0) {
            container.innerHTML = '<p style="color:var(--texto-secundario);font-size:0.85rem;text-align:center;padding:16px;">Nenhum exercício encontrado.</p>';
            return;
        }

        Object.entries(data).forEach(([categoria, exercicios]) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'ex-categoria-grupo';
            catDiv.innerHTML = `<div class="ex-cat-label">${getCatIcon(categoria)} ${categoria}</div>`;

            exercicios.forEach(ex => {
                const btn = document.createElement('button');
                btn.className = 'ex-item-btn';
                btn.innerHTML = `<span>${ex.nome}</span><span class="ex-add-icon">+</span>`;
                btn.onclick = () => adicionarExercicio(ex);
                catDiv.appendChild(btn);
            });

            container.appendChild(catDiv);
        });
    }

    function adicionarExercicio(ex) {
        // Verifica se já está no plano
        if (planoAtual.find(e => e.exercicioId === ex.id)) {
            Swal.fire({
                icon: 'info',
                title: 'Já adicionado',
                text: `${ex.nome} já está no plano.`,
                confirmButtonColor: '#8A2BE2',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        planoAtual.push({
            exercicioId: ex.id,
            nome: ex.nome,
            categoria: ex.categoria,
            series: 3,
            repeticoes: 12,
            peso: 0
        });
        renderizarPlano();

        // Feedback visual no botão
        Swal.fire({
            icon: 'success',
            title: `${ex.nome} adicionado!`,
            timer: 1000,
            showConfirmButton: false,
            position: 'bottom-end',
            toast: true
        });
    }

    function getCatIcon(cat) {
        const icons = {
            'Peito': '🏋️', 'Costas': '💪', 'Pernas': '🦵',
            'Ombros': '🔝', 'Bíceps': '💪', 'Tríceps': '💪',
            'Abdômen': '🎯', 'Cardio': '🏃'
        };
        return icons[cat] || '⚡';
    }

    // ===== SALVAR PLANO =====
    document.getElementById('btn-salvar-plano').addEventListener('click', function () {
        if (!alunoSelecionadoId) return;
        if (planoAtual.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Plano vazio', text: 'Adicione ao menos um exercício.', confirmButtonColor: '#8A2BE2' });
            return;
        }

        const btn = this;
        btn.textContent = 'Salvando...';
        btn.disabled = true;

        const headers = { 'Content-Type': 'application/json' };
        headers[getCsrfHeader()] = getCsrfToken();

        fetch('/api/treinador/salvar-plano-exercicios', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ alunoId: alunoSelecionadoId, exercicios: planoAtual })
        })
            .then(r => r.json())
            .then(data => {
                const dark = document.documentElement.classList.contains('dark-mode');
                Swal.fire({
                    title: 'Plano salvo!',
                    text: 'O treino do aluno foi atualizado.',
                    icon: 'success',
                    confirmButtonColor: '#8A2BE2',
                    background: dark ? '#16162a' : '#fff',
                    color: dark ? '#f0eeff' : '#1a1a2e'
                });
            })
            .finally(() => {
                btn.textContent = '💾 Salvar Plano';
                btn.disabled = false;
            });
    });

    // ===== BUSCA E FILTRO =====
    document.getElementById('busca-exercicio').addEventListener('input', function () {
        carregarExercicios(this.value, document.getElementById('filtro-categoria').value);
    });

    document.getElementById('filtro-categoria').addEventListener('change', function () {
        carregarExercicios(document.getElementById('busca-exercicio').value, this.value);
    });

    carregarAlunos();
});