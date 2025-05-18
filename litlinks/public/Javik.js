console.log('Скрипт Javik.js загружен!');
document.addEventListener('DOMContentLoaded', function () {
    const menuIcon = document.getElementById('menu-icon');
    const sidebar = document.getElementById('sidebar');
    const closeMenu = document.getElementById('close-menu');
    const openLogin = document.getElementById('open-login');
    const openRegister = document.getElementById('open-register');
    const closeLogin = document.getElementById('close-login');
    const closeRegister = document.getElementById('close-register');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authLink = document.getElementById('auth-link'); // было authLink
    const profileLink = document.querySelector('.profile-button'); // было profileLink
    const logoutIcon = document.querySelector('.logout-icon');
    const profileLogin = document.getElementById('profile-login');
    const profileEmail = document.getElementById('profile-email');
    const openSettings = document.getElementById('open-settings');
    const settingsSection = document.getElementById('settings');
    const editAboutMeButton = document.getElementById('edit-about-me');
    const aboutMeText = document.getElementById('about-me-text');
    const settingsForm = document.getElementById('settings-form');
    const chatToggle = document.querySelector('.chat-toggle');
    const chatContainer = document.querySelector('.chat-container');
    const closeChat = document.querySelector('.close-chat');
    const sendButton = document.getElementById('send-message');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    
window.currentUser = JSON.parse(localStorage.getItem('user'));
    window.addEventListener('storage', (event) => {
        console.log('Событие storage сработало:', event);
    });
    // Проверка авторизации при загрузке страницы
    document.addEventListener('DOMContentLoaded', function () {
        checkAuth();
    });
   // Делаем функцию checkAuth глобальной
   function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authLink = document.getElementById('authLink'); // Кнопки "Войти" и "Регистрация"
    const profileLink = document.getElementById('profile-link'); // Кнопка "Профиль"
    const settingsLink = document.getElementById('settings-link'); // Кнопка "Настройки"
    const bookmarksLink = document.getElementById('bookmarks-link'); // Кнопка "Закладки"
    const logoutLink = document.getElementById('logout-icon'); // Кнопка "Выйти"
    const notificationsLink = document.getElementById('notifications-link');
    if (user) {
        // Пользователь авторизован
        if (authLink) authLink.classList.add('hidden'); // Скрываем "Войти" и "Регистрация"
        if (profileLink) profileLink.classList.remove('hidden'); // Показываем "Профиль"
        if (settingsLink) settingsLink.classList.remove('hidden'); // Показываем "Настройки"
        if (bookmarksLink) bookmarksLink.classList.remove('hidden'); // Показываем "Закладки"
        if (logoutLink) logoutLink.classList.remove('hidden'); // Показываем "Выйти"
         if (notificationsLink) notificationsLink.classList.remove('hidden');
        if (profileLogin) profileLogin.textContent = user.login;
        if (profileEmail) profileEmail.textContent = user.email;
    } else {
        // Пользователь не авторизован
        if (authLink) authLink.classList.remove('hidden'); // Показываем "Войти" и "Регистрация"
        if (profileLink) profileLink.classList.add('hidden'); // Скрываем "Профиль"
        if (settingsLink) settingsLink.classList.add('hidden'); // Скрываем "Настройки"
        if (bookmarksLink) bookmarksLink.classList.add('hidden'); // Скрываем "Закладки"
        if (logoutLink) logoutLink.classList.add('hidden'); // Скрываем "Выйти"
         if (notificationsLink) notificationsLink.classList.add('hidden');
        if (window.location.pathname.endsWith('profile.html') || window.location.pathname.endsWith('bookmarks.html')) {
            window.location.href = 'index.html';
        }
    }
}

window.onload = function() {
    checkAuth();
};
const user = JSON.parse(localStorage.getItem('user'));
console.log('Пользователь:', user);

document.addEventListener('DOMContentLoaded', function () {
    // Вызов проверки авторизации при загрузке страницы
    checkAuth();
    console.log('checkAuth вызвана');
});
    // Вызов проверки авторизации при загрузке страницы
    checkAuth();
    console.log('checkAuth вызвана');


    let currentUserId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию и устанавливаем currentUserId
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        currentUserId = user.id;
    }

    // Получаем ID пользователя из URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    
    if (!userId) {
        // Если ID не указан, показываем профиль текущего пользователя
        loadCurrentUserProfile();
    } else {
        // Загружаем данные профиля указанного пользователя
        loadUserProfile(userId);
    }
});


async function loadUserProfile(userId) {
    try {
        const response = await fetch(`http://5.129.203.13:5001/api/user/${userId}`);
        if (!response.ok) {
            throw new Error('Пользователь не найден');
        }
        const user = await response.json();
        
        // Заполняем данные профиля
        document.getElementById('profile-username').textContent = user.login;
        document.getElementById('profile-avatar').src = user.avatar_url || '/images/default-avatar.png';
        document.getElementById('profile-about').textContent = user.about_me || 'Пользователь пока ничего о себе не рассказал';
        
        // Показываем кнопку "Написать сообщение" если это не наш профиль
        if (user.id !== currentUserId) {
            document.getElementById('message-button').style.display = 'block';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        document.getElementById('profile-container').innerHTML = `
            <div class="error-message">Пользователь не найден</div>
        `;
    }
}

window.loadCurrentUserProfile = function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    console.log('Загрузка профиля для:', user.id);
    document.getElementById('profile-username').textContent = user.login;
    
    // Загрузка книг
    window.loadUserBooks(user.id);
};

window.loadUserBooks = async function(userId) {
    const grid = document.getElementById('user-books-grid');
    if (!grid) return;

    try {
        const response = await fetch(`http://5.129.203.13:5001/api/user-books/${userId}`);
        const books = await response.json();
        
        grid.innerHTML = books.map(book => `
            <div style="margin: 10px; padding: 10px; border: 1px solid #ccc;">
                <img src="${book.cover_url || 'default-cover.jpg'}" 
                     style="width: 80px; height: 120px; object-fit: cover;">
                <div>${book.title}</div>
            </div>
        `).join('');
    } catch (error) {
        grid.innerHTML = '<p>Ошибка загрузки книг</p>';
        console.error(error);
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    if (typeof loadCurrentUserProfile === 'function') {
        loadCurrentUserProfile();
    }
});

async function loadUserBooks(userId) {
    const grid = document.getElementById('user-books-grid');
    if (!grid) {
        console.error('ОШИБКА: Не найден элемент #user-books-grid');
        return;
    }

    try {
        grid.innerHTML = '<p>Загрузка книг...</p>';
        
        const response = await fetch(`http://5.129.203.13:5001/api/user-books/${userId}`);
        if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
        
        const books = await response.json();
        console.log('Получены книги:', books);

        if (books.length === 0) {
            grid.innerHTML = '<p class="no-books">У вас пока нет книг</p>';
            return;
        }

        grid.innerHTML = books.map(book => `
            <div class="book-card" 
                 onclick="location.href='book.html?id=${book.id}'"
                 style="cursor: pointer; margin: 10px; padding: 10px; border: 1px solid #ddd;">
                <img src="${book.cover_url || 'default-cover.jpg'}" 
                     alt="${book.title}" 
                     style="width: 80px; height: 120px; object-fit: cover;">
                <div>${book.title}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Ошибка:', error);
        grid.innerHTML = `<p class="error">Ошибка загрузки: ${error.message}</p>`;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUserProfile();
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    if (userId) {
        loadUserProfileById(userId);
    } else {
        loadCurrentUserProfile();
    }
});

    // Открытие/закрытие меню
    if (menuIcon && sidebar && closeMenu) {
        // Открытие меню
        menuIcon.addEventListener('click', function () {
            sidebar.classList.add('active');
            document.querySelector('.chat-widget').classList.add('shift');
            document.querySelector('.chat-container').classList.add('shift');
        });

        // Закрытие меню
        closeMenu.addEventListener('click', function () {
            sidebar.classList.remove('active');
            document.querySelector('.chat-widget').classList.remove('shift');
            document.querySelector('.chat-container').classList.remove('shift');
        });
    } else {
        console.error('Один из элементов (menuIcon, sidebar, closeMenu) не найден в DOM.');
    }
    
// Открытие/закрытие модальных окон
if (openLogin && openRegister && closeLogin && closeRegister) {
    // Функция для закрытия модального окна при клике вне его
    const setupModalClose = (modal) => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    };

    // Обработчики для окна входа
    openLogin.addEventListener('click', function(e) {
        e.preventDefault();
        loginModal.classList.add('active');
    });
    
    closeLogin.addEventListener('click', function() {
        loginModal.classList.remove('active');
    });
    setupModalClose(loginModal);

    // Обработчики для окна регистрации
    openRegister.addEventListener('click', function(e) {
        e.preventDefault();
        registerModal.classList.add('active');
    });
    
    closeRegister.addEventListener('click', function() {
        registerModal.classList.remove('active');
    });
    setupModalClose(registerModal);
}
    // Регистрация
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const login = document.getElementById('register-login').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;

            if (password !== confirmPassword) {
                alert('Пароли не совпадают!');
                return;
            }

            try {
                const response = await fetch('http://5.129.203.13:5001/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login, email, password }),
                });

                const data = await response.json();
                alert(data.message);
                if (response.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    checkAuth(); // Обновляем состояние авторизации
                    window.location.href = 'profile.html';
                }
            } catch (err) {
                alert('Ошибка регистрации: ' + err.message);
            }
        });
    }

    // Вход
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const login = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('http://5.129.203.13:5001/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login, password }),
                });

                const data = await response.json();
                alert(data.message);
                if (response.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    checkAuth(); // Обновляем состояние авторизации
                    window.location.href = 'profile.html';
                }
            } catch (err) {
                alert('Ошибка входа: ' + err.message);
            }
        });
    }

    // Логика выхода
    logoutIcon.addEventListener('click', function () {
        console.log('Кнопка выхода нажата');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        checkAuth();
        window.location.href = 'index.html';
    });
    
    logoutIcon.addEventListener('click', function () {
        console.log('🔴 Выход: удаляем пользователя...');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    
        console.log('🔄 Вызываем checkAuth()');
        checkAuth();
    
        console.log('➡️ Перенаправляем на index.html');
        window.location.href = 'index.html';
    });


    // Открытие/закрытие настроек
    if (openSettings && settingsSection) {
        openSettings.addEventListener('click', function (e) {
            e.preventDefault();
            settingsSection.classList.toggle('hidden');
        });
    }

    // Редактирование информации о себе
    if (editAboutMeButton && aboutMeText) {
        editAboutMeButton.addEventListener('click', function () {
            const newAboutMe = prompt('Расскажите о себе:', aboutMeText.textContent);
            if (newAboutMe !== null) {
                aboutMeText.textContent = newAboutMe;
                const user = JSON.parse(localStorage.getItem('user'));
                user.aboutMe = newAboutMe;
                localStorage.setItem('user', JSON.stringify(user));
            }
        });
    }
});
document.querySelectorAll('.chat-toggle').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelector('.chat-container').classList.toggle('active');
    });
});

// Закрытие чата при клике вне его области
document.addEventListener('click', (e) => {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer.classList.contains('active') && 
        !e.target.closest('.chat-container') && 
        !e.target.closest('.chat-toggle')) {
        chatContainer.classList.remove('active');
    }
});
document.addEventListener('DOMContentLoaded', loadRecommendations);
async function loadRecommendations() {
    try {
        console.log('Загрузка книг...');
        const response = await fetch('http://5.129.203.13:5001/api/books');
        const books = await response.json();
        console.log('Загруженные книги:', books);

        const booksGrid = document.getElementById('books');
        if (booksGrid) {
            booksGrid.innerHTML = ''; // Очищаем текущий список книг

            books.forEach(book => {
                console.log('Добавление книги:', book.title);
                const bookCard = document.createElement('div');
                bookCard.classList.add('book-card');

                // Обложка книги
                const bookCover = document.createElement('img');
                bookCover.classList.add('book-cover');
                bookCover.src = book.cover_url || 'default-cover.jpg'; // Используем URL обложки или дефолтную картинку
                bookCover.alt = book.title;

                // Заголовок книги
                const bookTitle = document.createElement('h3');
                bookTitle.classList.add('book-title');
                bookTitle.textContent = book.title;

                // Автор книги
                const bookAuthor = document.createElement('p');
                bookAuthor.classList.add('book-author');
                bookAuthor.textContent = `Автор: ${book.author}`;

                // Рейтинг книги
                const bookRating = document.createElement('p');
                bookRating.classList.add('book-rating');
                bookRating.textContent = `Рейтинг: ${book.rating || 'Нет оценки'}`;

                // Кнопка добавления в закладки
                const addToBookmarksButton = document.createElement('button');
                addToBookmarksButton.textContent = '📚 Добавить в закладки';
                addToBookmarksButton.addEventListener('click', () => addToBookmarks(book.id));

                // Собираем элементы в карточку
                bookCard.appendChild(bookCover);
                bookCard.appendChild(bookTitle);
                bookCard.appendChild(bookAuthor);
                bookCard.appendChild(bookRating);
                bookCard.appendChild(addToBookmarksButton);

                booksGrid.appendChild(bookCard);
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const addBookButton = document.getElementById('add-book-button');
    if (addBookButton) {
        addBookButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Проверяем авторизацию перед переходом
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Для добавления книги необходимо авторизоваться!');
                return;
            }
            window.location.href = 'upload.html';
        });
    }
})


async function fetchUserBookmarks(userId) {
    try {
        const response = await fetch(`http://5.129.203.13:5001/api/bookmarks/${userId}`);
        const bookmarks = await response.json();
        return bookmarks;
    } catch (error) {
        console.error('Ошибка при загрузке закладок:', error);
        return [];
    }
}
function filterBookmarksByGenre() {
    const genreFilter = document.getElementById('genre-filter');
    const selectedGenre = genreFilter.value;
    const bookmarksGrid = document.getElementById('bookmarks-grid');
    const bookmarkCards = bookmarksGrid.querySelectorAll('.bookmark-card');

    bookmarkCards.forEach(card => {
        const cardGenres = card.dataset.genre; // Это строка с жанрами через запятую
        const genresArray = cardGenres ? cardGenres.split(',') : [];
        
        if (selectedGenre === 'all' || genresArray.includes(selectedGenre)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
// Загружаем закладки при загрузке страницы
document.addEventListener('DOMContentLoaded', loadBookmarks);
async function removeFromBookmarks(bookId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Для удаления из закладок необходимо войти в систему.');
        return;
    }

    try {
        fetch(`http://5.129.203.13:5001/api/bookmarks/${bookmarkId}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        alert(data.message);
        loadBookmarks(); // Обновляем список закладок
    } catch (error) {
        console.error('Ошибка при удалении из закладок:', error);
    }
}

async function addToBookmarks(bookId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Для добавления в закладки необходимо войти в систему.');
        return;
    }

    try {
        const response = await fetch('http://5.129.203.13:5001/api/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, bookId }), // Убедитесь, что userId и bookId передаются
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка:', errorText);
            alert(`Ошибка: ${errorText}`);
            return;
        }

        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error('Ошибка при добавлении в закладки:', error);
    }
}

const user = JSON.parse(localStorage.getItem('user')); // Получаем пользователя из localStorage
if (user) {
    // Проверяем, существует ли свойство bookmarks
    if (!user.bookmarks) {
        user.bookmarks = []; // Инициализируем bookmarks как пустой массив, если его нет
    }

    // Добавляем книгу в закладки
    user.bookmarks.push(book);

    // Сохраняем обновлённые данные пользователя
    localStorage.setItem('user', JSON.stringify(user));

    alert('Книга добавлена в закладки!');
} else {
   // alert('Пользователь не авторизован.');
}

/* console.log('Книга:', book); // Логируем объект книги */

if (user) {
    if (!user.bookmarks) {
        console.log('Свойство bookmarks отсутствует, инициализируем его');
        user.bookmarks = [];
    }

    user.bookmarks.push(book);
    localStorage.setItem('user', JSON.stringify(user));
    alert('Книга добавлена в закладки!');
} else {
   // console.error('Пользователь не авторизован');
   // alert('Пользователь не авторизован.');
}
    
// Загружаем закладки при загрузке страницы
document.addEventListener('DOMContentLoaded', loadBookmarks);

async function loadBookmarks() {
    const user = JSON.parse(localStorage.getItem('user'));
    const bookmarksGrid = document.getElementById('bookmarks-grid');

    if (!bookmarksGrid || !user) {
        console.warn('❗ Пользователь не найден или список закладок отсутствует.');
        return;
    }

    try {
        const response = await fetch(`http://5.129.203.13:5001/api/bookmarks/${user.id}`);
        const bookmarks = await response.json();
        console.log('📖 Полученные закладки:', bookmarks);

        bookmarksGrid.innerHTML = ''; // Очищаем список перед добавлением новых элементов

        bookmarks.forEach(bookmark => {
            console.log(`📌 Добавляем книгу: ${bookmark.title}`);

            // Создаём карточку для закладки
            const bookmarkCard = document.createElement('div');
            bookmarkCard.classList.add('bookmark-card');
            // Сохраняем жанры в data-атрибут (может быть строка с несколькими жанрами через запятую)
            bookmarkCard.dataset.genre = bookmark.genres || '';

            // Обложка книги
            const bookCover = document.createElement('img');
            bookCover.src = bookmark.cover_url || 'default-cover.jpg';
            bookCover.alt = bookmark.title;

            // Заголовок книги
            const bookTitle = document.createElement('h3');
            bookTitle.textContent = bookmark.title;

            // Автор книги
            const bookAuthor = document.createElement('p');
            bookAuthor.textContent = `Автор: ${bookmark.author}`;

            // Кнопка удаления закладки
            const removeButton = document.createElement('button');
            removeButton.textContent = '❌ Удалить';
            removeButton.classList.add('remove-button');
            removeButton.addEventListener('click', () => removeFromBookmarks(bookmark.id));

            // Собираем элементы в карточку
            bookmarkCard.appendChild(bookCover);
            bookmarkCard.appendChild(bookTitle);
            bookmarkCard.appendChild(bookAuthor);
            bookmarkCard.appendChild(removeButton);

            bookmarksGrid.appendChild(bookmarkCard);
        });

        // Добавляем обработчик для фильтрации по жанру
        const genreFilter = document.getElementById('genre-filter');
        genreFilter.addEventListener('change', filterBookmarksByGenre);

    } catch (error) {
        console.error('❌ Ошибка загрузки закладок:', error);
    }
}
async function removeFromBookmarks(bookId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Для удаления из закладок необходимо войти в систему.');
        return;
    }

    try {
        const response = await fetch('http://5.129.203.13:5001/api/bookmarks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, bookId }), // Передаем userId и bookId
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка:', errorText);
            alert(`Ошибка: ${errorText}`);
            return;
        }

        const data = await response.json();
        alert(data.message);

        // Обновляем список закладок
        loadBookmarks();
    } catch (error) {
        console.error('Ошибка при удалении из закладок:', error);
    }
}

async function loadBooks() {
    try {
        const response = await fetch('/api/books');
        const books = await response.json();
        
        const booksContainer = document.getElementById('books');
        booksContainer.innerHTML = '';
        
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.innerHTML = `
                <button class="bookmark-button" data-book-id="${book.id}">❤</button>
                <img src="${book.cover_url}" alt="${book.title}" class="book-cover">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-rating">${generateRatingStars(book.rating)}</div>
            `;
            booksContainer.appendChild(bookCard);
        });
        
        // Проверяем, какие книги уже в закладках (если пользователь авторизован)
        if (currentUser) {
            checkBookmarksStatus(currentUser.id);
        }
    } catch (error) {
        console.error('Ошибка при загрузке книг:', error);
    }
}

// Функция для проверки статуса закладок
async function checkBookmarksStatus(userId) {
    try {
        const response = await fetch(`/api/bookmarks/${userId}`);
        const bookmarks = await response.json();
        
        bookmarks.forEach(book => {
            const button = document.querySelector(`.bookmark-button[data-book-id="${book.id}"]`);
            if (button) {
                button.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Ошибка при проверке закладок:', error);
    }
}

// Функция для генерации звезд рейтинга
function generateRatingStars(rating) {
    const fullStars = '★'.repeat(Math.floor(rating));
    const emptyStars = '☆'.repeat(5 - Math.ceil(rating));
    return fullStars + emptyStars;
}

// Обработчик клика по кнопке закладки
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('bookmark-button')) {
        const button = e.target;
        const bookId = button.dataset.bookId;
        const userId = currentUser?.id; // Предполагаем, что currentUser содержит данные авторизованного пользователя
        
        if (!userId) {
            showNotification('Для добавления в закладки необходимо авторизоваться', 'error');
            return;
        }
        
        try {
            if (button.classList.contains('active')) {
                // Удаляем из закладок
                const response = await fetch('/api/bookmarks', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, bookId })
                });
                
                if (response.ok) {
                    button.classList.remove('active');
                    showNotification('Книга удалена из закладок', 'success');
                }
            } else {
                // Добавляем в закладки
                const response = await fetch('/api/bookmarks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, bookId })
                });
                
                if (response.ok) {
                    button.classList.add('active');
                    showNotification('Книга добавлена в закладки', 'success');
                }
            }
            
            // Анимация
            button.classList.add('pulse');
            setTimeout(() => button.classList.remove('pulse'), 500);
        } catch (error) {
            console.error('Ошибка при обновлении закладок:', error);
            showNotification('Ошибка при обновлении закладок', 'error');
        }
    }
});

// Функция для показа уведомлений
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

async function loadUserBooks(userId) {
    try {
        const response = await fetch(`http://5.129.203.13:5001/api/user-books/${userId}`);
        const books = await response.json();
        
        const booksGrid = document.getElementById('user-books-grid');
        if (!booksGrid) {
            console.error('Элемент #user-books-grid не найден!');
            return;
        }

        // Полная очистка и перестроение HTML
        booksGrid.innerHTML = '';
        
        if (books.length === 0) {
            booksGrid.innerHTML = '<p class="no-books">У вас пока нет добавленных книг</p>';
            return;
        }

        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card-small';
            bookCard.innerHTML = `
                <img src="${book.cover_url || 'default-cover.jpg'}" 
                     alt="${book.title}"
                     class="book-cover-small"
                     onclick="window.location.href='book.html?id=${book.id}'">
                <div class="book-title-small">${book.title}</div>
            `;
            booksGrid.appendChild(bookCard);
        });

        // Принудительное применение стилей (на время отладки)
        booksGrid.style.display = 'grid';
        booksGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
        booksGrid.style.gap = '15px';
        booksGrid.style.marginTop = '10px';

    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
        const grid = document.getElementById('user-books-grid');
        if (grid) grid.innerHTML = '<p class="error">Ошибка загрузки списка книг</p>';
    }
}
// Инициализация после загрузки DOM
function initProfilePage() {
    if (!document.getElementById('user-books-grid')) return; // Если не на странице профиля
    
    if (typeof loadCurrentUserProfile === 'function') {
        loadCurrentUserProfile();
    } else {
        console.error('Функция loadCurrentUserProfile не найдена!');
        emergencyLoadBooks();
    }
}

function emergencyLoadBooks() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    fetch(`http://5.129.203.13:5001/api/user-books/${user.id}`)
        .then(r => r.json())
        .then(books => {
            const grid = document.getElementById('user-books-grid');
            if (grid) grid.innerHTML = books.map(b => 
                `<div>${b.title}</div>`
            ).join('');
        });
}

// Запускаем инициализацию при загрузке
document.addEventListener('DOMContentLoaded', initProfilePage);

function requestExchange(bookId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Для запроса обмена необходимо войти в систему');
        return;
    }

    fetch('http://5.129.203.13:5001/api/exchange-request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            requester_id: user.id,
            book_id: bookId,
            message: 'Хочу обменяться этой книгой'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Запрос на обмен отправлен!');
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при отправке запроса');
    });
}