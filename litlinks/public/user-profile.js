document.addEventListener('DOMContentLoaded', function() {
    // Получаем ID пользователя из URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    if (!userId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Загружаем данные профиля
    loadUserProfile(userId);
    
    // Обработчик кнопки "Добавить в друзья"
    document.getElementById('add-friend-button').addEventListener('click', function() {
        addFriend(userId);
    });
});

async function loadUserProfile(userId) {
    try {
        const response = await fetch(`http://5.129.203.13:5001/api/user/${userId}`);
        if (!response.ok) throw new Error('Пользователь не найден');
        
        const user = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('user'));
        
        // Загружаем аватар
        const avatarImg = document.getElementById('user-avatar');
        const avatarUrl = user.avatar_url || '/images/default-avatar.png';
        avatarImg.src = avatarUrl.startsWith('http') ? avatarUrl : `http://5.129.203.13:5001${avatarUrl}`;
        
        // Заполняем данные
        document.getElementById('user-login').textContent = user.login;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-about').textContent = user.aboutMe || 'Пользователь пока ничего о себе не рассказал';
        
        // Проверяем друзей (если пользователь авторизован)
        if (currentUser) {
            // Если это профиль текущего пользователя - скрываем кнопку
            if (currentUser.id == userId) {
                document.getElementById('add-friend-button').style.display = 'none';
            } else {
                // Проверяем, есть ли уже этот пользователь в друзьях
                const friendsResponse = await fetch(`http://5.129.203.13:5001/api/friends/check?followerId=${currentUser.id}&followingId=${userId}`);
                if (friendsResponse.ok) {
                    const isFriend = await friendsResponse.json();
                    if (isFriend) {
                        document.getElementById('add-friend-button').style.display = 'none';
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        document.getElementById('user-profile-container').innerHTML = `
            <div class="error-message">Пользователь не найден</div>
        `;
    }
}

async function addFriend(userId) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        alert('Для добавления в друзья необходимо войти в систему');
        return;
    }
    
    const button = document.getElementById('add-friend-button');
    button.disabled = true;
    button.textContent = 'Добавление...';
    
    try {
        const response = await fetch('http://5.129.203.13:5001/api/friends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                followerId: currentUser.id, 
                followingId: userId 
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            // Вместо изменения текста просто скрываем кнопку
            button.style.display = 'none';
            
            // Можно показать уведомление об успешном добавлении
            showNotification('Пользователь добавлен в друзья!', 'success');
        } else {
            button.disabled = false;
            button.textContent = 'Добавить в друзья';
            alert(data.error || 'Ошибка при добавлении в друзья');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        button.disabled = false;
        button.textContent = 'Добавить в друзья';
        alert('Ошибка при добавлении в друзья');
    }
}

// Функция для показа уведомлений (добавьте в ваш файл)
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