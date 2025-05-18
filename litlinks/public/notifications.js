document.addEventListener('DOMContentLoaded', function() {
    loadNotifications();
    
    // Добавляем иконку уведомлений в header
    addNotificationBadge();
});

function loadNotifications() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    fetch(`http://5.129.203.13:5001/api/notifications/${user.id}`)
        .then(response => response.json())
        .then(notifications => {
            const container = document.getElementById('notifications-list');
            
            if (notifications.length === 0) {
                container.innerHTML = `
                    <div class="empty-notifications">
                        У вас пока нет уведомлений
                    </div>
                `;
                return;
            }

            container.innerHTML = notifications.map(notif => `
                <div class="notification-item ${notif.is_read ? '' : 'unread'}" 
                     data-id="${notif.id}">
                    ${notif.cover_url ? `
                        <img src="${notif.cover_url}" 
                             alt="${notif.book_title || 'Книга'}" 
                             class="notification-cover">
                    ` : ''}
                    <div class="notification-content">
                        <div class="notification-meta">
                            <span>${new Date(notif.created_at).toLocaleString()}</span>
                            ${notif.is_read ? '' : '<span class="new-badge">Новое</span>'}
                        </div>
                        <p class="notification-text">
                            ${getNotificationText(notif)}
                        </p>
                        <div class="notification-actions">
                            ${notif.type === 'exchange_request' ? `
                                <button class="btn-accept" onclick="acceptExchange(${notif.id})">
                                    Принять
                                </button>
                                <button class="btn-reject" onclick="rejectExchange(${notif.id})">
                                    Отклонить
                                </button>
                            ` : ''}
                            ${notif.book_id ? `
                                <button class="notification-button primary" 
                                        onclick="location.href='book.html?id=${notif.book_id}'">
                                    Посмотреть книгу
                                </button>
                            ` : ''}
                            <button class="notification-button secondary mark-as-read">
                                Пометить прочитанным
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Обработчики остаются без изменений
            document.querySelectorAll('.mark-as-read').forEach(button => {
                button.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const notificationId = this.closest('.notification-item').dataset.id;
                    markAsRead(notificationId);
                });
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки уведомлений:', error);
        });
}

function getNotificationText(notification) {
    switch (notification.type) {
        case 'exchange_request':
            return `Пользователь ${notification.sender_login} хочет обменяться книгой "${notification.book_title}"`;
        case 'exchange_accepted':
            return `Пользователь ${notification.sender_login} принял ваш запрос на обмен "${notification.book_title}"`;
        case 'exchange_rejected':
            return `Пользователь ${notification.sender_login} отклонил ваш запрос на обмен "${notification.book_title}"`;
        case 'new_message':
            return `Новое сообщение от ${notification.sender_login}`;
        default:
            return notification.message || 'У вас новое уведомление';
    }
}

function markAsRead(notificationId) {
    fetch(`http://5.129.203.13:5001/api/notifications/${notificationId}/read`, {
        method: 'PUT'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Обновляем конкретное уведомление
            const item = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (item) {
                item.classList.remove('unread');
                item.querySelector('.new-badge')?.remove();
            }
            
            // Обновляем счетчик в сайдбаре
            updateNotificationCounter();
        }
    });
}
// Функция для добавления бейджа с количеством непрочитанных уведомлений в header
function addNotificationBadge() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const notificationLink = document.createElement('a');
    notificationLink.href = 'notifications.html';
    notificationLink.className = 'notification-link';
    notificationLink.innerHTML = `
        <span class="notification-icon">🔔</span>
        <span class="notification-badge"></span>
    `;

    const headerControls = document.querySelector('.header-controls');
    if (headerControls) {
        headerControls.prepend(notificationLink);
        updateNotificationBadge();
    }
}

function updateNotificationCounter() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    fetch(`http://5.129.203.13:5001/api/notifications/${user.id}/unread-count`)
        .then(response => response.json())
        .then(data => {
            const counter = document.querySelector('.notification-counter');
            if (counter) {
                if (data.count > 0) {
                    counter.textContent = data.count > 9 ? '9+' : data.count;
                    counter.style.display = 'flex';
                } else {
                    counter.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки счетчика уведомлений:', error);
        });
}

// Вызываем при загрузке страницы и после важных действий
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Обновляем счетчик каждые 30 секунд
    setInterval(updateNotificationCounter, 30000);
});
async function acceptExchange(notificationId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showNotification('Для выполнения действия необходимо войти в систему', 'error');
            return;
        }

        // 1. Получаем полные данные уведомления
        const notificationResponse = await fetch(`http://5.129.203.13:5001/api/notifications/${notificationId}/full`);
        const notification = await notificationResponse.json();
        
        if (!notification) {
            throw new Error('Уведомление не найдено');
        }

        // Для запросов на обмен проверяем наличие exchange_request_id
        if (notification.type === 'exchange_request' && !notification.exchange_request_id) {
            throw new Error('Не удалось найти связанный запрос на обмен');
        }

        // 2. Отправляем запрос на принятие обмена
        const response = await fetch('http://5.129.203.13:5001/api/exchange/accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestId: notification.exchange_request_id,
                userId: user.id,
                notificationId: notification.id // Добавляем ID уведомления для отслеживания
            })
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        showNotification('Запрос на обмен принят!', 'success');
        
        // Обновляем список уведомлений и счетчик
        loadNotifications();
        updateNotificationCounter();
        
        // Обновляем список книг, если находимся на странице профиля
        if (typeof loadUserBooks === 'function') {
            loadUserBooks(user.id);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}
async function rejectExchange(notificationId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showNotification('Для выполнения действия необходимо войти в систему', 'error');
            return;
        }

        // 1. Получаем полные данные уведомления
        const notificationResponse = await fetch(`http://5.129.203.13:5001/api/notifications/${notificationId}/full`);
        const notification = await notificationResponse.json();
        
        if (!notification || !notification.exchange_request_id) {
            throw new Error('Не удалось найти связанный запрос на обмен');
        }

        // 2. Отправляем запрос на отклонение обмена
        const response = await fetch('http://5.129.203.13:5001/api/exchange/reject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestId: notification.exchange_request_id,
                userId: user.id,
                notificationId: notification.id
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        showNotification('Запрос на обмен отклонен', 'info');
        
        // Обновляем список уведомлений и счетчик
        loadNotifications();
        updateNotificationCounter();
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}
function renderNotification(notif) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification-item ${notif.is_read ? '' : 'unread'}`;
    notificationElement.dataset.id = notif.id;
    
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
        ${notif.cover_url ? `
            <img src="${notif.cover_url}" 
                 alt="${notif.book_title || 'Книга'}" 
                 class="notification-cover">
        ` : ''}
        <div class="notification-content">
            <div class="notification-meta">
                <span>${new Date(notif.created_at).toLocaleString()}</span>
                ${notif.is_read ? '' : '<span class="new-badge">Новое</span>'}
            </div>
            <p class="notification-text">
                ${getNotificationText(notif)}
            </p>
            ${actions}
        </div>
    `;
    
    return notificationElement;
}