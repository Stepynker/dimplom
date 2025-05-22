document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли ID книги в URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    if (!bookId) {
        alert('Книга не найдена!');
        window.location.href = 'index.html';
        return;
    }

    // Проверяем авторизацию пользователя
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Для просмотра книги необходимо авторизоваться!');
        window.location.href = 'index.html';
        return;
    }

    // Устанавливаем пользователя в глобальную область видимости
    window.currentUser = user;

    // Загружаем данные книги
    loadBook(bookId, user.id);
});

async function loadBook(bookId, userId) {
    try {
        // Получаем данные книги
        const bookResponse = await fetch(`http://5.129.203.13:5001/api/books/${bookId}`);
        if (!bookResponse.ok) {
            throw new Error('Книга не найдена');
        }
        const book = await bookResponse.json();

        // Получаем владельцев книги
        const ownersResponse = await fetch(`http://5.129.203.13:5001/api/book-owners/${bookId}`);
        if (!ownersResponse.ok) {
            throw new Error('Не удалось загрузить владельцев');
        }
        const owners = await ownersResponse.json();

        // Отображаем данные книги
        renderBook(book, owners, userId);
    } catch (error) {
        console.error('Ошибка загрузки книги:', error);
        alert('Произошла ошибка при загрузке данных книги');
        window.location.href = 'index.html';
    }
}
function renderOwner(owner, currentUserId, bookId) {
    const isCurrentUser = owner.user_id === currentUserId;
    const isAvailable = owner.is_available;
    
    return `
        <li class="owner-item">
            <span>Пользователь ID: ${owner.user_id}</span>
            ${!isCurrentUser && isAvailable ? `
                <button class="exchange-button" 
                        onclick="requestExchange(${currentUserId}, ${owner.user_id}, ${bookId})">
                    Запросить обмен
                </button>
            ` : `
                <span class="owner-status">
                    ${isCurrentUser ? '(ваша книга)' : '(недоступно для обмена)'}
                </span>
            `}
        </li>
    `;
}

async function requestExchange(bookId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showNotification('Для запроса обмена необходимо войти в систему', 'error');
        return;
    }

    try {
        // 1. Получаем владельца книги
        const ownerResponse = await fetch(`http://5.129.203.13:5001/api/book-owners/${bookId}`);
        const owners = await ownerResponse.json();
        
        if (!owners || owners.length === 0) {
            throw new Error('Не найдены активные владельцы книги');
        }

        // Фильтруем только доступных владельцев
        const availableOwners = owners.filter(owner => owner.is_available);
        if (availableOwners.length === 0) {
            throw new Error('Нет доступных владельцев для обмена');
        }

        const ownerId = availableOwners[0].user_id;
        
        // Проверяем, что пользователь не отправляет запрос сам себе
        if (ownerId === user.id) {
            showNotification('Нельзя отправить запрос самому себе', 'error');
            return;
        }

        // 2. Отправляем запрос на обмен
        const response = await fetch('http://5.129.203.13:5001/api/exchange-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requesterId: user.id,
                ownerId: ownerId,
                bookId: bookId,
                message: `Пользователь ${user.login} хочет обменяться книгой`
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        showNotification('Запрос на обмен успешно отправлен!', 'success');
    } catch (error) {
        console.error('Ошибка запроса обмена:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}


function renderBook(book) {
    const container = document.getElementById('book-container');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Проверяем, является ли текущий пользователь владельцем книги
    const isOwner = user && book.owner_id === user.id;
    
    // Формируем кнопки в зависимости от прав
    let actionButtons = '';
    if (user) {
        if (isOwner) {
            actionButtons = `
                <button class="book-button danger" id="remove-book">
                    Удалить книгу
                </button>
            `;
        } else {
            actionButtons = `
                <button class="book-button secondary" id="request-exchange">
                    Запросить обмен
                </button>
                <button class="book-button primary" id="add-to-bookmarks">
                    Добавить в закладки
                </button>
            `;
        }
    }

    container.innerHTML = `
        <div class="book-header">
            <img src="${book.cover_url || 'default-cover.jpg'}" 
                 alt="${book.title}" 
                 class="book-cover-large">
            <div class="book-info">
                <h1 class="book-title">${book.title}</h1>
                <p class="book-author">Автор: ${book.author}</p>
                <div class="book-meta">
                    <span>Год: ${book.publication_year || book.year || 'Не указан'}</span>
                    ${book.rating ? `<span>Рейтинг: ${book.rating}</span>` : ''}
                </div>
                <p class="book-description">${book.description || 'Описание отсутствует.'}</p>
                <div class="book-actions">
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
    
    // Добавляем обработчики
    document.getElementById('add-to-bookmarks')?.addEventListener('click', () => {
        addToBookmarks(book.id);
    });
    
 document.getElementById('request-exchange')?.addEventListener('click', async () => {
    // Получаем владельцев книги
    const ownersResponse = await fetch(`http://5.129.203.13:5001/api/book-owners/${book.id}`);
    const owners = await ownersResponse.json();
    
    if (owners && owners.length > 0) {
        const availableOwners = owners.filter(owner => owner.is_available);
        if (availableOwners.length > 0) {
            showExchangeModal(availableOwners[0].user_id, book.id);
        } else {
            showNotification('Нет доступных владельцев для обмена', 'error');
        }
    } else {
        showNotification('Не найдены владельцы книги', 'error');
    }
});
    
    document.getElementById('remove-book')?.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите удалить эту книгу?')) {
            removeBook(book.id);
        }
    });
}   
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
async function acceptExchange(requestId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch('http://5.129.203.13:5001/api/exchange/accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestId: requestId,
                userId: user.id
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        showNotification('Запрос на обмен принят!', 'success');
        loadNotifications(); // Обновляем список уведомлений
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Функция для обработки отклонения обмена
async function rejectExchange(requestId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch('http://5.129.203.13:5001/api/exchange/reject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestId: requestId,
                userId: user.id
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        showNotification('Запрос на обмен отклонен', 'info');
        loadNotifications(); // Обновляем список уведомлений
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}
function renderNotification(notif) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification-item ${notif.is_read ? '' : 'unread'}`;
    
    let actions = '';
    if (notif.type === 'exchange_request') {
        actions = `
            <div class="notification-actions">
                <button class="btn-accept" onclick="acceptExchange(${notif.id})">
                    Принять
                </button>
                <button class="btn-reject" onclick="rejectExchange(${notif.id})">
                    Отклонить
                </button>
            </div>
        `;
    }

    notificationElement.innerHTML = `
        <div class="notification-content">
            <p>${notif.message}</p>
            ${actions}
        </div>
    `;
    
    return notificationElement;
}
async function removeBook(bookId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showNotification('Для удаления книги необходимо войти в систему', 'error');
        return;
    }

    if (!confirm('Вы уверены, что хотите удалить эту книгу?')) {
        return;
    }

    try {
        const response = await fetch('http://5.129.203.13:5001/api/books', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                book_id: bookId
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Не удалось удалить книгу');
        }

        showNotification('Книга успешно удалена!', 'success');
        
        // Перенаправляем на профиль через 1.5 секунды
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('Ошибка удаления книги:', error);
        showNotification(error.message || 'Произошла ошибка при удалении книги', 'error');
    }
}

function showExchangeModal(ownerId, bookId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showNotification('Для запроса обмена необходимо войти в систему', 'error');
        return;
    }

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'exchange-modal';
    modal.innerHTML = `
        <div class="exchange-modal-content">
            <button class="close-exchange-modal">&times;</button>
            <h2>Запрос на обмен</h2>
            <div class="exchange-books-container">
                <div class="exchange-book-select">
                    <h3>Ваша книга для обмена</h3>
                    <div class="book-selection" id="user-book-selection">
                        <div class="add-book-btn" id="select-user-book">
                            <span>+</span>
                            <p>Выберите книгу</p>
                        </div>
                    </div>
                    <div class="user-books-dropdown" id="user-books-dropdown"></div>
                </div>
                <div class="exchange-arrow">⇄</div>
                <div class="exchange-book-target">
                    <h3>Книга для получения</h3>
                    <div class="book-selection" id="target-book-selection">
                        <img src="default-cover.jpg" alt="Обложка книги">
                        <p>Загрузка...</p>
                    </div>
                    <div class="target-user-info">
                        <p>Владелец: ${ownerId}</p>
                    </div>
                </div>
            </div>
            <div class="exchange-actions">
                <button class="exchange-submit-btn" id="submit-exchange">Отправить запрос</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Загружаем книги пользователя и информацию о книге
    loadUserBooksForExchange(user.id, bookId, ownerId);
    async function loadUserBooksForExchange(userId, targetBookId, ownerId) {
    try {
        const response = await fetch(`http://5.129.203.13:5001/api/user-books/${userId}`);
        const books = await response.json();
        
        // Фильтруем книги, чтобы исключить ту, на которую хотим обменяться
        const filteredBooks = books.filter(book => book.id != targetBookId);
        
        const dropdown = document.getElementById('user-books-dropdown');
        if (dropdown) {
            dropdown.innerHTML = filteredBooks.map(book => `
                <div class="user-book-item" data-book-id="${book.id}">
                    <img src="${book.cover_url || 'default-cover.jpg'}" alt="${book.title}">
                    <p>${book.title}</p>
                </div>
            `).join('');
            
            // Обработчик выбора книги
            document.querySelectorAll('.user-book-item').forEach(item => {
                item.addEventListener('click', function() {
                    const selectedBookId = this.dataset.bookId;
                    const selectedBook = filteredBooks.find(b => b.id == selectedBookId);
                    
                    const userBookSelection = document.getElementById('user-book-selection');
                    if (userBookSelection) {
                        userBookSelection.innerHTML = `
                            <img src="${selectedBook.cover_url || 'default-cover.jpg'}" alt="${selectedBook.title}">
                            <p>${selectedBook.title}</p>
                        `;
                        userBookSelection.dataset.bookId = selectedBookId;
                    }
                    
                    const dropdown = document.getElementById('user-books-dropdown');
                    if (dropdown) dropdown.classList.remove('show');
                });
            });
        }
        
        // Загружаем информацию о владельце
        const ownerResponse = await fetch(`http://5.129.203.13:5001/api/user/${ownerId}`);
        const owner = await ownerResponse.json();
        const targetUserInfo = document.querySelector('.target-user-info');
        if (targetUserInfo) {
            targetUserInfo.innerHTML = `
                <p>Владелец: ${owner.login}</p>
            `;
        }
        
        // Загружаем информацию о целевой книге
        const targetBookResponse = await fetch(`http://5.129.203.13:5001/api/books/${targetBookId}`);
        const targetBook = await targetBookResponse.json();
        const targetBookSelection = document.getElementById('target-book-selection');
        if (targetBookSelection) {
            targetBookSelection.innerHTML = `
                <img src="${targetBook.cover_url || 'default-cover.jpg'}" alt="${targetBook.title}">
                <p>${targetBook.title}</p>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
        showNotification('Ошибка загрузки данных для обмена', 'error');
    }
}
document.getElementById('submit-exchange').addEventListener('click', async () => {
    const userBookSelection = document.getElementById('user-book-selection');
    const userBookId = userBookSelection.dataset.bookId;
    
    if (!userBookId) {
        showNotification('Пожалуйста, выберите книгу для обмена', 'error');
        return;
    }
    
    try {
        const response = await fetch('http://5.129.203.13:5001/api/exchange-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requesterId: user.id,
                ownerId: ownerId,
                bookId: bookId,
                userBookId: userBookId,
                message: `Запрос на обмен`
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        showNotification('Запрос на обмен успешно отправлен!', 'success');
        document.querySelector('.exchange-modal')?.remove();
    } catch (error) {
        console.error('Ошибка запроса обмена:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
});

    // Обработчики событий
    document.getElementById('select-user-book')?.addEventListener('click', toggleBooksDropdown);
    document.querySelector('.close-exchange-modal')?.addEventListener('click', () => modal.remove());
    document.getElementById('submit-exchange')?.addEventListener('click', () => submitExchangeRequest(user.id, ownerId, bookId));
}
    
async function submitExchangeRequest(requesterId, ownerId, targetBookId) {
    const userBookSelection = document.getElementById('user-book-selection');
    const userBookId = userBookSelection?.dataset?.bookId;
    
    if (!userBookId) {
        showNotification('Пожалуйста, выберите книгу для обмена', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submit-exchange');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
    }

    try {
        console.log('Отправка запроса на обмен:', {
            requesterId,
            ownerId,
            targetBookId,
            userBookId
        });

        const response = await fetch('http://5.129.203.13:5001/api/exchange-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requesterId: parseInt(requesterId),
                ownerId: parseInt(ownerId),
                bookId: parseInt(targetBookId),
                userBookId: parseInt(userBookId),
                message: 'Запрос на обмен'
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Ошибка сервера:', data);
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        showNotification('Запрос на обмен успешно отправлен!', 'success');
        document.querySelector('.exchange-modal')?.remove();

    } catch (error) {
        console.error('Полная ошибка запроса обмена:', {
            error: error.message,
            stack: error.stack,
            time: new Date().toISOString()
        });
        
        showNotification(`Ошибка: ${error.message}`, 'error');
        
        if (submitBtn) {
            submitBtn.innerHTML = 'Повторить отправку';
            submitBtn.onclick = () => submitExchangeRequest(requesterId, ownerId, targetBookId);
            submitBtn.disabled = false;
        }
    }
}
function toggleBooksDropdown() {
    const dropdown = document.getElementById('user-books-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
}