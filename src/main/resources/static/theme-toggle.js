document.addEventListener('DOMContentLoaded', function () {
    const toggleSwitch = document.querySelector('#checkbox-theme');
    if (!toggleSwitch) return;

    // O <head> já aplicou o tema salvo (ou o do sistema); só sincroniza a chave
    toggleSwitch.checked = document.documentElement.classList.contains('dark-mode');

    toggleSwitch.addEventListener('change', function (e) {
        const escuro = e.target.checked;
        document.documentElement.classList.toggle('dark-mode', escuro);
        try { localStorage.setItem('theme', escuro ? 'dark' : 'light'); } catch (err) {}
    });
});
