document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const body = document.body;
    // Добавляем CSS для плавных переходов
    const style = document.createElement('style');
    style.textContent = `
        body, 
        .site-name, 
        .book-title, 
        h1, h2, h3, 
        p, a {
            transition: 
                color 0.4s ease-in-out, 
                background-color 0.4s ease-in-out;
        }
        #theme-toggle {
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    function updateThemeIcon(theme) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '🌞';
        // Анимация иконки
        themeToggle.style.fontSize = '24px';
        themeToggle.style.transform = 'scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = 'scale(1)';
        }, 200);
    }

    function updateTheme(theme) {
        // Запускаем переход
        body.style.transition = 'none';
        body.offsetHeight; // Триггер reflow
        body.style.transition = 'background-color 0.4s ease-in-out';
        
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Обновляем цвета с задержкой для плавности
        setTimeout(() => {
            updateTextColors(theme);
            updateThemeIcon(theme);
        }, 10);
    }

    function updateTextColors(theme) {
        const textElements = document.querySelectorAll('.site-name, .book-title, h1, h2, h3, p, a');
        textElements.forEach(el => {
            el.style.color = theme === 'light' ? '#000000' : '';
        });
    }

    // Инициализация
    const savedTheme = localStorage.getItem('theme') || 'dark';
    updateTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        updateTheme(newTheme);
    });
});
function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark.matches;
    document.body.classList.toggle('dark-theme', isDark);
  }
  
  // Переключение темы
  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
  
  // Инициализация
  applyTheme();