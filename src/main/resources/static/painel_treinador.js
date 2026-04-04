document.addEventListener('DOMContentLoaded', function() {
    const listaAlunosUL = document.getElementById('alunos-ul');
    const nomeAlunoTitulo = document.getElementById('aluno-selecionado-nome');
    const formPlano = document.getElementById('form-plano');
    const inputAlunoId = document.getElementById('aluno-id-hidden');
    const textareaTreino = document.getElementById('treino');
    const textareaDieta = document.getElementById('dieta');
    let liAlunos = [];

    // Pega o token CSRF das meta tags do HTML
    function getCsrfToken() {
        return document.querySelector('meta[name="_csrf"]')?.getAttribute('content') || '';
    }

    function getCsrfHeader() {
        return document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content') || 'X-CSRF-TOKEN';
    }

    function carregarAlunos() {
        fetch('/api/treinador/alunos')
            .then(response => response.json())
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
                    adicionarEventoClickAlunos();
                } else {
                    listaAlunosUL.innerHTML = '<li>Nenhum aluno encontrado.</li>';
                }
            })
            .catch(error => console.error("Erro ao buscar alunos:", error));
    }

    function adicionarEventoClickAlunos() {
        liAlunos.forEach(li => {
            li.addEventListener('click', function() {
                liAlunos.forEach(item => item.classList.remove('active'));
                this.classList.add('active');
                selecionarAluno(this.dataset.id, this.textContent);
            });
        });
    }

    function selecionarAluno(id, nome) {
        nomeAlunoTitulo.textContent = `Plano de ${nome}`;
        inputAlunoId.value = id;

        if (textareaTreino) textareaTreino.value = 'Carregando...';
        if (textareaDieta) textareaDieta.value = 'Carregando...';

        fetch(`/api/treinador/plano?alunoId=${id}`)
            .then(response => response.json())
            .then(data => {
                if (textareaTreino) textareaTreino.value = data.treino || '';
                if (textareaDieta) textareaDieta.value = data.dieta || '';
                formPlano.classList.remove('hidden');
            })
            .catch(error => {
                console.error("Erro ao buscar plano:", error);
                formPlano.classList.remove('hidden');
            });
    }

    formPlano.addEventListener('submit', function(event) {
        event.preventDefault();

        const btnSalvar = formPlano.querySelector('button');
        const textoOriginal = btnSalvar.innerText;
        btnSalvar.innerText = "Salvando...";
        btnSalvar.disabled = true;
        btnSalvar.style.opacity = "0.7";

        const params = new URLSearchParams({
            alunoId: inputAlunoId.value,
            treino: textareaTreino ? textareaTreino.value : '',
            dieta: textareaDieta ? textareaDieta.value : ''
        });

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        headers[getCsrfHeader()] = getCsrfToken();

        fetch('/api/treinador/salvar-plano', {
            method: 'POST',
            headers: headers,
            body: params
        })
            .then(response => response.json())
            .then(data => {
                const isDarkMode = document.documentElement.classList.contains('dark-mode');
                if (data.status === 'success') {
                    Swal.fire({
                        title: 'Tudo certo!',
                        text: 'O plano do aluno foi salvo com sucesso.',
                        icon: 'success',
                        confirmButtonText: 'Ótimo',
                        confirmButtonColor: '#8A2BE2',
                        background: isDarkMode ? '#1e1e1e' : '#ffffff',
                        color: isDarkMode ? '#ffffff' : '#333333'
                    });
                } else {
                    Swal.fire({
                        title: 'Ops...',
                        text: data.message || 'Erro ao salvar.',
                        icon: 'error',
                        confirmButtonColor: '#d33'
                    });
                }
            })
            .catch(error => {
                Swal.fire({
                    title: 'Erro de Conexão',
                    text: 'Verifique sua internet e tente novamente.',
                    icon: 'warning',
                    confirmButtonColor: '#8A2BE2'
                });
            })
            .finally(() => {
                btnSalvar.innerText = textoOriginal;
                btnSalvar.disabled = false;
                btnSalvar.style.opacity = "1";
            });
    });

    function fecharModalFoto() {
        document.getElementById('modal-foto').classList.remove('open');
    }

    function abrirModalFoto() {
        document.getElementById('modal-foto').classList.add('open');
    }

    document.getElementById('modal-foto').addEventListener('click', function(e) {
        if (e.target === this) fecharModalFoto();
    });

    document.querySelectorAll('a').forEach(link => {
        if (link.textContent.trim() === "Meu Perfil") {
            link.href = "javascript:void(0)";
            link.addEventListener('click', abrirModalFoto);
        }
    });

    carregarAlunos();
});