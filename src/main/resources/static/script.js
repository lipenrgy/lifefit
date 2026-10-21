document.addEventListener('DOMContentLoaded', function () {

    const calcForm = document.getElementById('calc-form');
    const resultadoDiv = document.getElementById('resultado');
    if (!calcForm) return;

    // Faixas da OMS; a escala visual vai de 15 a 40
    const FAIXAS = [
        { ate: 18.5,     nome: 'Abaixo do peso' },
        { ate: 25,       nome: 'Peso normal' },
        { ate: 30,       nome: 'Sobrepeso' },
        { ate: Infinity, nome: 'Obesidade' }
    ];
    const ESCALA_MIN = 15, ESCALA_MAX = 40;

    calcForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const estaLogado = calcForm.dataset.logado === 'true';
        const linkPainel = calcForm.dataset.link;

        const peso = parseFloat(document.getElementById('peso').value.replace(',', '.'));
        const altura = parseFloat(document.getElementById('altura').value);

        if (!(peso > 0) || !(altura > 0)) {
            resultadoDiv.innerHTML = '<p class="imc-resultado-vazio">Informe peso em kg e altura em cm, os dois maiores que zero.</p>';
            return;
        }

        const alturaM = altura / 100;
        const imc = peso / (alturaM * alturaM);
        const faixa = FAIXAS.find(f => imc < f.ate);
        const posicao = Math.min(Math.max((imc - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN), 0), 1) * 100;

        const proximo = estaLogado
            ? `<p>Seu treinador e seu nutricionista veem seus dados físicos quando você preenche em Configurações.</p>
               <a href="${linkPainel}" class="btn btn-secundario">Ir para meu painel</a>`
            : `<p>Quer um plano feito para você? Crie uma conta e escolha um treinador e um nutricionista.</p>
               <a href="/login?cadastro=true" class="btn btn-primario">Criar conta</a>`;

        resultadoDiv.innerHTML = `
            <div class="imc-valor">${imc.toFixed(1).replace('.', ',')}</div>
            <div class="imc-classe">${faixa.nome}</div>
            <div class="imc-escala" aria-hidden="true">
                <div class="imc-faixas"><span></span><span></span><span></span><span></span></div>
                <div class="imc-marcador" style="left:${posicao}%"></div>
            </div>
            <div class="imc-legenda" aria-hidden="true">
                <span style="left:0%">15</span><span style="left:14%">18,5</span><span style="left:40%">25</span><span style="left:60%">30</span><span style="left:100%">40</span>
            </div>
            <div class="imc-proximo">${proximo}</div>
        `;
    });
});
