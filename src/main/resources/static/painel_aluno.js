document.addEventListener('DOMContentLoaded', function() {

    const displayTreino = document.getElementById('meu-treino');
    const displayDieta = document.getElementById('minha-dieta');

    fetch('/api/aluno/meu-plano')
        .then(response => response.json())
        .then(data => {
            if (displayTreino) displayTreino.innerText = data.treino;
            if (displayDieta) displayDieta.innerText = data.dieta;
        })
        .catch(error => {
            console.error('Erro ao buscar plano:', error);
            if (displayTreino) displayTreino.innerText = "Erro ao carregar treino.";
            if (displayDieta) displayDieta.innerText = "Erro ao carregar dieta.";
        });

    // Modal foto
    function abrirModalFoto() {
        document.getElementById('modal-foto').classList.add('open');
    }

    function fecharModalFoto() {
        document.getElementById('modal-foto').classList.remove('open');
    }

    window.fecharModalFoto = fecharModalFoto;
    window.abrirModalFoto = abrirModalFoto;

    document.getElementById('modal-foto').addEventListener('click', function(e) {
        if (e.target === this) fecharModalFoto();
    });

    document.querySelectorAll('a').forEach(link => {
        if (link.textContent.trim() === "Meu Perfil") {
            link.href = "javascript:void(0)";
            link.addEventListener('click', abrirModalFoto);
        }
    });
});