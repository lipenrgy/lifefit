document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.querySelector('#checkbox-theme');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.classList.add(currentTheme === 'dark' ? 'dark-mode' : 'light-mode');
        if (currentTheme === 'dark' && toggleSwitch) {
            toggleSwitch.checked = true;
        }
    }

    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.classList.add('dark-mode');
            document.documentElement.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    }

    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', switchTheme, false);
    }
});