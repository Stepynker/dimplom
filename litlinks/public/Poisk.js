document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('search-button');
    const searchModal = document.getElementById('search-modal');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input-modal');
    const searchTabs = document.querySelectorAll('.search-tab');
    
    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }
    // Открытие модального окна поиска
    searchButton.addEventListener('click', function() {
        searchModal.classList.add('active');
        searchInput.focus();
    });
    
    // Закрытие модального окна
    closeSearch.addEventListener('click', function() {
        searchModal.classList.remove('active');
    });
    
    // Переключение вкладок
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Удаляем активный класс у всех вкладок
            searchTabs.forEach(t => t.classList.remove('active'));
            // Добавляем активный класс текущей вкладке
            this.classList.add('active');
            
            // Скрываем все содержимое вкладок
            document.querySelectorAll('.search-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Показываем содержимое активной вкладки
            const tabId = this.dataset.tab;
            document.getElementById(`${tabId}-results`).classList.add('active');
        });
    });
    
    // Обработка поискового запроса
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length > 2) {
            performSearch(query);
        } else {
            clearResults();
        }
    });
    
    // Функция поиска
    async function performSearch(query) {
        try {
            const activeTab = document.querySelector('.search-tab.active').dataset.tab;
            
            if (activeTab === 'books') {
                const response = await fetch(`/api/search/books?q=${encodeURIComponent(query)}`);
                const books = await response.json();
                showBookResults(books);
            } else {
                const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`);
                const users = await response.json();
                showUserResults(users);
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            clearResults();
        }
    }
    
    // Обновите функцию showBookResults:
function showBookResults(books) {
    const container = document.getElementById('books-results');
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="empty-results">Книги не найдены</div>';
        return;
    }
    
    container.innerHTML = '';
    books.forEach(book => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <img src="${book.cover_url || '/images/default-book.png'}" alt="${book.title}" class="book-cover-sm">
            <div class="search-result-info">
                <div class="search-result-title">${book.title}</div>
                <div class="search-result-author">${book.author}</div>
            </div>
        `;
        item.addEventListener('click', () => {
            window.location.href = `/book.html?id=${book.id}`;
        });
        container.appendChild(item);
    });
}

function showUserResults(users) {
    const container = document.getElementById('users-results');
    if (!users || users.length === 0) {
        container.innerHTML = '<div class="empty-results">Пользователи не найдены</div>';
        return;
    }
    
    container.innerHTML = '';
    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <img src="${user.avatar_url || '/images/default-avatar.png'}" alt="${user.login}" class="user-avatar-sm">
            <div class="search-result-info">
                <div class="search-result-title">${user.login}</div>
            </div>
        `;
        item.addEventListener('click', () => {
            window.location.href = `/user-profile.html?id=${user.id}`;
        });
        container.appendChild(item);
    });
}
    
    // Очистить результаты
    function clearResults() {
        document.getElementById('books-results').innerHTML = '<div class="empty-results">Введите запрос для поиска книг</div>';
        document.getElementById('users-results').innerHTML = '<div class="empty-results">Введите запрос для поиска пользователей</div>';
    }
});
searchInput.addEventListener('input', debounce(async function() {
    const query = this.value.trim();
    if (query.length > 1) {
        try {
            await performSearch(query);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            clearResults();
        }
    } else {
        clearResults();
    }
}));
async function performSearch(query) {
    const activeTab = document.querySelector('.search-tab.active').dataset.tab;
    const container = document.getElementById(`${activeTab}-results`);
    
    // Показываем индикатор загрузки
    container.innerHTML = '<div class="loading">Поиск...</div>';
    
    try {
        const response = await fetch(`/api/search/${activeTab}?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (activeTab === 'books') {
            showBookResults(results);
        } else {
            showUserResults(results);
        }
    } catch (error) {
        console.error('Ошибка поиска:', error);
        container.innerHTML = '<div class="error">Ошибка при выполнении поиска</div>';
    }
}