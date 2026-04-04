document.addEventListener('DOMContentLoaded', function() {

    const calcForm = document.getElementById('calc-form');
    const resultadoDiv = document.getElementById('resultado');

    if (calcForm) {
        calcForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const estaLogado = calcForm.getAttribute('data-logado') === 'true';
            const linkPainel = calcForm.getAttribute('data-link');

            const peso = parseFloat(document.getElementById('peso').value);
            const altura = parseFloat(document.getElementById('altura').value);

            if (isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) {
                alert("Por favor, insira valores válidos.");
                return;
            }

            const alturaEmMetros = altura / 100;
            const imc = peso / (alturaEmMetros * alturaEmMetros);
            const imcFormatado = imc.toFixed(2);

            let classificacao = '';
            let cor = '';

            if (imc < 18.5)       { classificacao = 'Abaixo do peso';       cor = '#ffc107'; }
            else if (imc < 24.9)  { classificacao = 'Peso normal (Em forma)'; cor = '#2ecc71'; }
            else if (imc < 29.9)  { classificacao = 'Sobrepeso';             cor = '#e67e22'; }
            else                  { classificacao = 'Obesidade';              cor = '#e74c3c'; }

            let htmlBotao = '';
            let textoIncentivo = '';

            if (estaLogado) {
                textoIncentivo = 'Esse resultado já fica salvo no seu histórico!';
                htmlBotao = `
                    <a href="${linkPainel}" class="btn" style="background-color:#8A2BE2;color:white;display:inline-block;margin-top:10px;text-decoration:none;padding:10px 20px;border-radius:5px;">
                        Ir para meu Painel
                    </a>`;
            } else {
                textoIncentivo = 'Este é um ótimo primeiro passo! Que tal um plano feito sob medida?';
                htmlBotao = `
                    <a href="/login" class="btn" style="background-color:#8A2BE2;color:white;display:inline-block;margin-top:10px;text-decoration:none;padding:10px 20px;border-radius:5px;">
                        Registre-se para um Plano Personalizado!
                    </a>`;
            }

            resultadoDiv.classList.remove('hidden');
            resultadoDiv.innerHTML = `
                <h3 style="color:#8A2BE2;">Seu Resultado:</h3>
                <p>Seu IMC é <strong>${imcFormatado}</strong>.</p>
                <p>Classificação: <strong style="color:${cor}">${classificacao}</strong>.</p>
                <p style="margin-top:15px;color:#ccc;font-size:0.9rem;">${textoIncentivo}</p>
                ${htmlBotao}
            `;
        });
    }
});