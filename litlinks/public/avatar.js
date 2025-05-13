const changeAvatarBtn = document.getElementById('change-avatar');
const avatarInput = document.getElementById('avatar-input');
const avatarPreview = document.getElementById('avatar-preview');
const profileAvatar = document.getElementById('profile-avatar');

// Модальное окно для загрузки аватарки
const avatarModal = document.createElement('div');
avatarModal.id = 'avatar-modal';
avatarModal.className = 'modal';
avatarModal.innerHTML = `
    <div class="modal-content">
        <button class="close-modal" id="close-avatar-modal">×</button>
        <h2>Изменение аватарки</h2>
        <div class="avatar-upload-container">
            <div class="avatar-preview" id="avatar-preview">
                <img id="preview-image" src="${profileAvatar.src}" alt="Предпросмотр аватарки">
            </div>
            <div class="upload-actions">
                <input type="file" id="avatar-input" accept="image/*">
                <label for="avatar-input" class="file-label">Выбрать файл</label>
                <button id="upload-avatar-btn" class="upload-btn">Загрузить</button>
            </div>
        </div>
    </div>
`;
document.body.appendChild(avatarModal);

// Элементы модального окна
const closeAvatarModal = document.getElementById('close-avatar-modal');
const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
const avatarInputModal = document.getElementById('avatar-input');
const previewImage = document.getElementById('preview-image');

// Открытие модального окна
if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener('click', () => {
        avatarModal.classList.add('active');
    });
}

// Закрытие модального окна
if (closeAvatarModal) {
    closeAvatarModal.addEventListener('click', () => {
        avatarModal.classList.remove('active');
    });
}

// Предпросмотр выбранного изображения
if (avatarInputModal) {
    avatarInputModal.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                previewImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Замените обработчик uploadAvatarBtn на этот:
if (uploadAvatarBtn) {
    uploadAvatarBtn.addEventListener('click', async function() {
        const file = avatarInputModal.files[0];
        if (!file) {
            alert('Пожалуйста, выберите файл');
            return;
        }

        // Проверка размера файла (5MB максимум)
        if (file.size > 5 * 1024 * 1024) {
            alert('Файл слишком большой. Максимальный размер: 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);
        
        // Добавляем ID пользователя
 window.currentUser = JSON.parse(localStorage.getItem('user'));
        if (user) {
            formData.append('userId', user.id);
        }

        try {
            uploadAvatarBtn.disabled = true;
            uploadAvatarBtn.textContent = 'Загрузка...';
            
            const response = await fetch('http://localhost:5000/api/upload-avatar', {
                method: 'POST',
                body: formData,
                // Не устанавливайте заголовок Content-Type - браузер сделает это автоматически с boundary
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка загрузки аватарки');
            }

            // Обновляем аватарку в профиле
            profileAvatar.src = data.avatarUrl;
            
            // Обновляем данные пользователя в localStorage
            if (user) {
                user.avatarUrl = data.avatarUrl;
                localStorage.setItem('user', JSON.stringify(user));
            }
            
            // Закрываем модальное окно
            avatarModal.classList.remove('active');
            
            // Показываем уведомление
            showNotification('Аватар успешно обновлен!', 'success');
            
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка: ' + error.message, 'error');
        } finally {
            uploadAvatarBtn.disabled = false;
            uploadAvatarBtn.textContent = 'Загрузить';
        }
    });
}

// Функция для показа уведомлений (добавьте в ваш код)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

async function uploadAvatar(file, userId) {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', userId);

    try {
        const response = await fetch('http://localhost:5000/api/upload-avatar', {
            method: 'POST',
            body: formData,
            // Не устанавливаем Content-Type вручную!
        });

        // Проверяем Content-Type ответа
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Сервер вернул не JSON: ${text.substring(0, 100)}...`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }

        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// Обработчик кнопки загрузки
if (uploadAvatarBtn) {
    uploadAvatarBtn.addEventListener('click', async function() {
        const file = avatarInputModal.files[0];
        if (!file) {
            showNotification('Пожалуйста, выберите файл', 'error');
            return;
        }

        // Проверка типа файла
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showNotification('Разрешены только JPG, PNG и GIF изображения', 'error');
            return;
        }

        // Проверка размера файла
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Файл слишком большой (макс. 5MB)', 'error');
            return;
        }

   window.currentUser = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            showNotification('Необходимо авторизоваться', 'error');
            return;
        }

        try {
            uploadAvatarBtn.disabled = true;
            uploadAvatarBtn.textContent = 'Загрузка...';

            const result = await uploadAvatar(file, user.id);
            
            // Обновляем интерфейс
            profileAvatar.src = result.avatarUrl;
            user.avatarUrl = result.avatarUrl;
            localStorage.setItem('user', JSON.stringify(user));
            
            showNotification('Аватар успешно обновлен!', 'success');
            avatarModal.classList.remove('active');
            
        } catch (error) {
            console.error('Avatar upload failed:', error);
            showNotification(`Ошибка: ${error.message}`, 'error');
        } finally {
            uploadAvatarBtn.disabled = false;
            uploadAvatarBtn.textContent = 'Загрузить';
        }
    });
}





// Закрытие модального окна при клике вне его
avatarModal.addEventListener('click', function(e) {
    if (e.target === avatarModal) {
        avatarModal.classList.remove('active');
    }
});