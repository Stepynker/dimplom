document.addEventListener('DOMContentLoaded', function () {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const style = document.createElement('style');
    style.textContent = `
        body, .site-name, .book-title, h1, h2, h3, p, a {
            transition: color 0.4s ease-in-out, background-color 0.4s ease-in-out;
        }
        #theme-toggle {
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    function updateThemeIcon(theme) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '🌞';
        themeToggle.style.fontSize = '24px';
        themeToggle.style.transform = 'scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = 'scale(1)';
        }, 200);
    }

    function setTheme(theme) {
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon(theme);
    }

    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (prefersDark.matches ? 'dark' : 'light');
    setTheme(initialTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });
});