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
    const authLink = document.getElementById('authLink');
    const profileLink = document.getElementById('profileLink');
    const logoutIcon = document.querySelector('.logout-icon');

    if (user) {
        // Пользователь авторизован
        if (authLink) authLink.classList.add('hidden'); // Скрываем кнопки "Войти" и "Регистрация"
        if (profileLink) profileLink.classList.remove('hidden'); // Показываем кнопки "Профиль", "Настройки" и "Закладки"
        if (profileLogin) profileLogin.textContent = user.login;
        if (profileEmail) profileEmail.textContent = user.email;
    } else {
        // Пользователь не авторизован
        if (authLink) authLink.classList.remove('hidden'); // Показываем кнопки "Войти" и "Регистрация"
        if (profileLink) profileLink.classList.add('hidden'); // Скрываем кнопки "Профиль", "Настройки" и "Закладки"
        if (window.location.pathname.endsWith('profile.html') || window.location.pathname.endsWith('bookmarks.html')) {
            window.location.href = 'index.html';
        }
        if (openLogin && openRegister) {
            openLogin.addEventListener('click', function (e) {
                e.preventDefault();
                if (window.location.pathname.endsWith('bookmarks.html')) {
                    window.location.href = 'index.html';
                } else {
                    loginModal.classList.add('active');
                }
                
            });

            openRegister.addEventListener('click', function (e) {
                e.preventDefault();
                if (window.location.pathname.endsWith('bookmarks.html')) {
                    window.location.href = 'index.html';
                } else {
                    registerModal.classList.add('active');
                }
            });
        }
    }
}
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

    // Открытие/закрытие меню
    if (menuIcon && sidebar && closeMenu) {
        menuIcon.addEventListener('click', function () {
            sidebar.classList.add('active');
            document.querySelector('.chat-widget').classList.toggle('shift');
            document.querySelector('.chat-container').classList.toggle('shift');
        });
        
        closeMenu.addEventListener('click', function () {
            sidebar.classList.remove('active');
            document.querySelector('.chat-widget').classList.remove('shift');
            document.querySelector('.chat-container').classList.remove('shift');
        });
    }

    // Открытие/закрытие модальных окон
    if (openLogin && openRegister && closeLogin && closeRegister) {
        openLogin.addEventListener('click', function (e) {
            e.preventDefault();
            loginModal.classList.add('active');
        });

        openRegister.addEventListener('click', function (e) {
            e.preventDefault();
            registerModal.classList.add('active');
        });

        closeLogin.addEventListener('click', function () {
            loginModal.classList.remove('active');
        });

        closeRegister.addEventListener('click', function () {
            registerModal.classList.remove('active');
        });
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
                const response = await fetch('http://localhost:5000/api/register', {
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
                const response = await fetch('http://localhost:5000/api/login', {
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
// открытие чата и закрытие его 
document.querySelectorAll('.chat-toggle').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelector('.chat-container').classList.toggle('active');
    });
});

document.addEventListener('DOMContentLoaded', loadRecommendations);
async function loadRecommendations() {
    try {
        console.log('Загрузка книг...');
        const response = await fetch('http://localhost:5000/api/books');
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

async function fetchUserBookmarks(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/bookmarks/${userId}`);
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
        const cardGenre = card.dataset.genre;
        if (selectedGenre === 'all' || cardGenre === selectedGenre) {
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
        fetch(`http://localhost:5000/api/bookmarks/${bookmarkId}`, {
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
        const response = await fetch('http://localhost:5000/api/bookmarks', {
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

console.log('Пользователь:', user); // Логируем объект пользователя
console.log('Книга:', book); // Логируем объект книги

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
        const response = await fetch(`http://localhost:5000/api/bookmarks/${user.id}`);
        const bookmarks = await response.json();
        console.log('📖 Полученные закладки:', bookmarks);

        bookmarksGrid.innerHTML = ''; // Очищаем список перед добавлением новых элементов

        bookmarks.forEach(bookmark => {
            console.log(`📌 Добавляем книгу: ${bookmark.title}`);

            // Создаём карточку для закладки
            const bookmarkCard = document.createElement('div');
            bookmarkCard.classList.add('bookmark-card');
            bookmarkCard.dataset.genre = bookmark.genre; // Добавляем жанр книги в data-атрибут

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
            removeButton.addEventListener('click', () => removeFromBookmarks(bookmark.id)); // Передаем bookmark.id, а не book.id

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
        const response = await fetch('http://localhost:5000/api/bookmarks', {
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

document.addEventListener('DOMContentLoaded', function () {
    const avatarUpload = document.getElementById('avatar-upload');
    const changeAvatarButton = document.getElementById('change-avatar');

    // Обработчик для кнопки "Изменить аватарку"
    changeAvatarButton.addEventListener('click', function () {
        console.log('Кнопка "Изменить аватарку" нажата'); // Логируем нажатие кнопки
        avatarUpload.click(); // Открываем диалог выбора файла
    });

    // Обработчик для загрузки файла
    avatarUpload.addEventListener('change', async function (event) {
        const file = event.target.files[0];
        if (file) {
            console.log('Файл выбран:', file.name); // Логируем имя файла
            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const response = await fetch('/api/upload-avatar', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                if (response.ok) {
                    console.log('Аватарка успешно загружена:', data.avatarUrl); // Логируем успешную загрузку
                    document.getElementById('profile-avatar').src = data.avatarUrl; // Обновляем аватарку
                    alert('Аватарка успешно обновлена!');
                } else {
                    console.error('Ошибка при загрузке аватарки:', data.error); // Логируем ошибку
                    alert('Ошибка при загрузке аватарки: ' + data.error);
                }
            } catch (error) {
                console.error('Ошибка при загрузке аватарки:', error); // Логируем ошибку
                alert('Ошибка при загрузке аватарки');
            }
        } else {
            console.log('Файл не выбран'); // Логируем, если файл не выбран
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const editAboutMeButton = document.getElementById('edit-about-me');
    const aboutMeText = document.getElementById('about-me-text');

    // Обработчик для кнопки "Редактировать"
    editAboutMeButton.addEventListener('click', async function () {
        const newAboutMe = prompt('Расскажите о себе:', aboutMeText.textContent);
        if (newAboutMe !== null) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user) {
                    //alert('Пользователь не авторизован.');
                    return;
                }

                const response = await fetch('/api/update-about-me', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, aboutMe: newAboutMe }),
                });

                const data = await response.json();
                if (response.ok) {
                    aboutMeText.textContent = newAboutMe; // Обновляем текст "О себе"
                    alert('Информация о себе успешно обновлена!');
                } else {
                    alert('Ошибка при обновлении информации: ' + data.error);
                }
            } catch (error) {
                console.error('Ошибка при обновлении информации:', error);
                alert('Ошибка при обновлении информации');
            }
        }
    });
});