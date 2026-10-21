document.addEventListener('DOMContentLoaded', function () {
    const listaContatos = document.getElementById('lista-contatos');
    const areaMensagens = document.getElementById('chat-messages');
    const formMensagem = document.getElementById('form-mensagem');
    const inputMensagem = document.getElementById('input-mensagem');
    const inputDestinatario = document.getElementById('id-destinatario-atual');
    const nomeDestinatario = document.getElementById('nome-destinatario');

    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    const NOMES_TIPO = { aluno: 'Aluno', treinador: 'Treinador', nutricionista: 'Nutricionista' };

    let chatInterval = null;
    let ultimaQuantidade = -1;

    // 1. Contatos
    fetch('/api/chat/contatos')
        .then(res => res.json())
        .then(contatos => {
            listaContatos.innerHTML = '';
            if (contatos.length === 0) {
                listaContatos.innerHTML = '<p class="placeholder-col">Ninguém para conversar ainda. Alunos conversam com o treinador e o nutricionista que escolheram.</p>';
                return;
            }
            contatos.forEach(c => {
                const botao = document.createElement('button');
                botao.type = 'button';
                botao.className = 'contact-item';

                let avatar;
                if (c.foto) {
                    avatar = document.createElement('img');
                    avatar.src = c.foto;
                    avatar.alt = '';
                    avatar.className = 'avatar';
                } else {
                    avatar = document.createElement('span');
                    avatar.className = 'avatar avatar-iniciais';
                    avatar.textContent = (c.nome || '?').charAt(0).toUpperCase();
                }

                const info = document.createElement('div');
                const nome = document.createElement('strong');
                nome.textContent = c.nome;
                const tipo = document.createElement('span');
                tipo.textContent = NOMES_TIPO[c.tipo] || c.tipo;
                info.append(nome, tipo);

                botao.append(avatar, info);
                botao.addEventListener('click', () => abrirConversa(c.id, c.nome, botao));
                listaContatos.appendChild(botao);
            });
        })
        .catch(() => {
            listaContatos.innerHTML = '<p class="placeholder-col">Não foi possível carregar as conversas. Recarregue a página.</p>';
        });

    // 2. Abrir conversa
    function abrirConversa(id, nome, botao) {
        nomeDestinatario.textContent = nome;
        inputDestinatario.value = id;
        formMensagem.classList.remove('hidden');

        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        botao.classList.add('active');

        ultimaQuantidade = -1;
        areaMensagens.innerHTML = '';
        if (chatInterval) clearInterval(chatInterval);
        carregarMensagens();
        chatInterval = setInterval(carregarMensagens, 3000);
        inputMensagem.focus();
    }

    // 3. Mensagens (texto do usuário entra sempre via textContent)
    function carregarMensagens() {
        const idContato = inputDestinatario.value;
        if (!idContato) return;

        fetch(`/api/chat/conversa?idContato=${encodeURIComponent(idContato)}`)
            .then(res => res.json())
            .then(msgs => {
                if (msgs.length === ultimaQuantidade) return; // nada novo, não mexe na rolagem
                ultimaQuantidade = msgs.length;

                areaMensagens.innerHTML = '';
                if (msgs.length === 0) {
                    const vazio = document.createElement('p');
                    vazio.className = 'empty-state';
                    vazio.textContent = 'Nenhuma mensagem ainda. Escreva a primeira abaixo.';
                    areaMensagens.appendChild(vazio);
                    return;
                }
                msgs.forEach(m => {
                    const souEu = String(m.id_remetente) !== String(idContato);
                    const div = document.createElement('div');
                    div.className = `message ${souEu ? 'sent' : 'received'}`;
                    div.textContent = m.mensagem;

                    const hora = document.createElement('div');
                    hora.className = 'message-time';
                    hora.textContent = m.hora;
                    div.appendChild(hora);

                    areaMensagens.appendChild(div);
                });
                areaMensagens.scrollTop = areaMensagens.scrollHeight;
            });
    }

    // 4. Enviar
    formMensagem.addEventListener('submit', function (e) {
        e.preventDefault();
        const msg = inputMensagem.value.trim();
        const dest = inputDestinatario.value;
        if (!msg) return;

        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        headers[csrfHeader] = csrfToken;

        fetch('/api/chat/enviar', { method: 'POST', headers, body: new URLSearchParams({ idDestinatario: dest, mensagem: msg }) })
            .then(res => res.json())
            .then(data => {
                if (data.status !== 'success') throw new Error(data.message);
                inputMensagem.value = '';
                carregarMensagens();
            })
            .catch(() => {
                inputMensagem.setCustomValidity('A mensagem não foi enviada. Tente de novo.');
                inputMensagem.reportValidity();
                inputMensagem.setCustomValidity('');
            });
    });
});
