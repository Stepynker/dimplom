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

function renderBook(book, owners, currentUserId) {
    const container = document.getElementById('book-container');
    if (!container) {
        console.error('Контейнер для книги не найден');
        return;
    }

    container.innerHTML = `
        <div class="book-header">
            <h2>${book.title}</h2>
            <img src="${book.cover_url || 'default-cover.jpg'}" alt="Обложка" class="book-cover">
        </div>
        <div class="book-details">
            <p><strong>Автор:</strong> ${book.author}</p>
            ${book.description ? `<p><strong>Описание:</strong> ${book.description}</p>` : ''}
            ${book.publication_year ? `<p><strong>Год издания:</strong> ${book.publication_year}</p>` : ''}
        </div>
        <div class="book-owners">
            <h3>Владельцы книги:</h3>
            <ul class="owners-list">
                ${owners.map(owner => renderOwner(owner, currentUserId, book.id)).join('')}
            </ul>
        </div>
    `;
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
document.addEventListener('DOMContentLoaded', function() {
    // Получаем ID книги из URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    if (bookId) {
        // Загружаем данные книги с сервера
        fetch(`http://5.129.203.13:5001/api/books/${bookId}`)
            .then(response => response.json())
            .then(book => {
                renderBook(book);
            });
    }
});

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
    
    document.getElementById('request-exchange')?.addEventListener('click', () => {
        requestExchange(book.id);
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
