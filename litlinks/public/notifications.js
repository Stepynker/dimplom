document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    loadNotifications();
});

async function loadNotifications() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        console.log('Загрузка уведомлений для пользователя:', user.id);
        
        const response = await fetch(`http://5.129.203.13:5001/api/notifications/${user.id}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const notifications = await response.json();
        console.log('Получены уведомления:', notifications);
        
        if (!Array.isArray(notifications)) {
            throw new Error('Сервер вернул невалидные данные');
        }

        renderNotifications(notifications);
    } catch (error) {
        console.error('Ошибка загрузки уведомлений:', error);
        showNotification('Не удалось загрузить уведомления', 'error');
        renderNotifications([]);
    }
}
function renderNotifications(notifications) {
    const container = document.getElementById('notifications-list');
    
    if (!container) {
        console.error('Контейнер для уведомлений не найден');
        return;
    }

    if (!notifications || notifications.length === 0) {
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
                        <button class="btn-accept" data-id="${notif.id}">
                            Принять
                        </button>
                        <button class="btn-reject" data-id="${notif.id}">
                            Отклонить
                        </button>
                    ` : ''}
                    ${notif.book_id ? `
                        <button class="notification-button primary" 
                                onclick="location.href='book.html?id=${notif.book_id}'">
                            Посмотреть книгу
                        </button>
                    ` : ''}
                    <button class="notification-button secondary mark-as-read" data-id="${notif.id}">
                        Пометить прочитанным
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Делегирование событий для кнопок
    container.addEventListener('click', function(e) {
        const notificationId = e.target.closest('[data-id]')?.dataset.id;
        if (!notificationId) return;

        if (e.target.classList.contains('btn-accept')) {
            acceptExchange(notificationId);
        } else if (e.target.classList.contains('btn-reject')) {
            rejectExchange(notificationId);
        } else if (e.target.classList.contains('mark-as-read')) {
            markAsRead(notificationId);
        }
    });
}

function getNotificationText(notification) {
    switch (notification.type) {
        case 'exchange_request':
            return `Пользователь ${notification.sender_login} хочет обменять книгу "${notification.offered_book_title}" на вашу книгу "${notification.requested_book_title}"`;
        case 'exchange_accepted':
            return `Пользователь ${notification.sender_login} принял ваш запрос на обмен "${notification.offered_book_title}" на "${notification.requested_book_title}"`;
        case 'exchange_rejected':
            return `Пользователь ${notification.sender_login} отклонил ваш запрос на обмен "${notification.offered_book_title}" на "${notification.requested_book_title}"`;
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

async function acceptExchange(notificationId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showNotification('Требуется авторизация', 'error');
            return;
        }

        const btn = document.querySelector(`.notification-item[data-id="${notificationId}"] .btn-accept`);
        if (btn) btn.disabled = true;

        const response = await fetch('http://5.129.203.13:5001/api/exchange/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId, userId: user.id })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка сервера');
        }

        // Удаляем уведомление из DOM
        document.querySelector(`.notification-item[data-id="${notificationId}"]`)?.remove();
        showNotification('Обмен подтверждён', 'success');
        
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(error.message, 'error');
        if (btn) btn.disabled = false;
    }
}

async function rejectExchange(notificationId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showNotification('Требуется авторизация', 'error');
            return;
        }

        const btn = document.querySelector(`.notification-item[data-id="${notificationId}"] .btn-reject`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loader-small"></span> Отклоняем...';
        }

        const response = await fetch('http://5.129.203.13:5001/api/exchange/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                notificationId: notificationId, 
                userId: user.id 
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка сервера при отклонении');
        }

        // Удаляем уведомление из DOM
        document.querySelector(`.notification-item[data-id="${notificationId}"]`)?.remove();
        showNotification('Обмен отклонён', 'info');
        
    } catch (error) {
        console.error('Ошибка при отклонении:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
        
        // Разблокируем кнопку при ошибке
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Отклонить';
        }
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