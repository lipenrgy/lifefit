document.addEventListener('DOMContentLoaded', function() {
    const listaContatos = document.getElementById('lista-contatos');
    const areaMensagens = document.getElementById('chat-messages');
    const formMensagem = document.getElementById('form-mensagem');
    const inputMensagem = document.getElementById('input-mensagem');
    const inputDestinatario = document.getElementById('id-destinatario-atual');
    const nomeDestinatario = document.getElementById('nome-destinatario');

    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    let chatInterval = null;

    // 1. Carregar Contatos
    fetch('/api/chat/contatos')
        .then(res => res.json())
        .then(contatos => {
            listaContatos.innerHTML = '';
            if (contatos.length === 0) {
                listaContatos.innerHTML = '<p style="padding:20px; text-align:center;">Nenhum contato encontrado.</p>';
                return;
            }
            contatos.forEach(c => {
                const foto = c.foto
                    ? c.foto
                    : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.nome) + '&background=random';

                const div = document.createElement('div');
                div.className = 'contact-item';
                div.innerHTML = `
                    <img src="${foto}" class="contact-avatar">
                    <div class="contact-info">
                        <h4>${c.nome}</h4>
                        <p>${c.tipo}</p>
                    </div>
                `;
                div.addEventListener('click', () => abrirConversa(c.id, c.nome));
                listaContatos.appendChild(div);
            });
        });

    // 2. Abrir Conversa
    function abrirConversa(id, nome) {
        nomeDestinatario.innerText = nome;
        inputDestinatario.value = id;
        formMensagem.style.display = 'flex';

        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        event.currentTarget && event.currentTarget.classList.add('active');

        if (chatInterval) clearInterval(chatInterval);
        carregarMensagens();
        chatInterval = setInterval(carregarMensagens, 3000);
    }

    // 3. Carregar Mensagens
    function carregarMensagens() {
        const idContato = inputDestinatario.value;
        if (!idContato) return;

        fetch(`/api/chat/conversa?idContato=${idContato}`)
            .then(res => res.json())
            .then(msgs => {
                areaMensagens.innerHTML = '';
                msgs.forEach(m => {
                    const souEu = m.id_remetente != idContato;
                    const div = document.createElement('div');
                    div.className = `message ${souEu ? 'sent' : 'received'}`;
                    div.innerHTML = `
                        ${m.mensagem}
                        <div class="message-time">${m.hora}</div>
                    `;
                    areaMensagens.appendChild(div);
                });
                areaMensagens.scrollTop = areaMensagens.scrollHeight;
            });
    }

    // 4. Enviar Mensagem
    formMensagem.addEventListener('submit', function(e) {
        e.preventDefault();
        const msg = inputMensagem.value.trim();
        const dest = inputDestinatario.value;
        if (!msg) return;

        const params = new URLSearchParams({ idDestinatario: dest, mensagem: msg });
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        headers[csrfHeader] = csrfToken;

        fetch('/api/chat/enviar', { method: 'POST', headers: headers, body: params })
            .then(() => {
                inputMensagem.value = '';
                carregarMensagens();
            });
    });
});