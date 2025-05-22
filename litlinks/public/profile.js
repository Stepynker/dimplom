document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUserProfile();
    setupAvatarUpload();
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('user-books-grid')) return;
    
    function emergencyLoadBooks() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        
        fetch(`http://5.129.203.13:5001/api/user-books/${user.id}`)
            .then(r => r.json())
            .then(books => {
                const grid = document.getElementById('user-books-grid');
                if (grid) grid.innerHTML = books.map(b => 
                    `<div class="emergency-book-item">${b.title}</div>`
                ).join('');
            });
    }
});

 document.addEventListener('DOMContentLoaded', function() {
        // Проверяем, определена ли функция
        if (typeof loadCurrentUserProfile === 'function') {
            loadCurrentUserProfile();
        } else {
            console.error('Функция loadCurrentUserProfile не найдена!');
            // Аварийный вариант
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                fetch(`/api/user-books/${user.id}`)
                    .then(r => r.json())
                    .then(books => {
                        const grid = document.getElementById('user-books-grid');
                        if (grid) grid.innerHTML = books.map(b => 
                            `<div>${b.title}</div>`
                        ).join('');
                    });
            }
        }
    });
    const addBookButton = document.getElementById('add-book-button');
if (addBookButton) {
    addBookButton.classList.add('book-button', 'primary');
}
async function loadCurrentUserProfile() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`http://5.129.203.13:5001/api/user/${user.id}`);
        if (!response.ok) throw new Error('Ошибка загрузки профиля');
        
        const userData = await response.json();
        updateProfileUI(userData);
        loadUserBooks(user.id);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function updateProfileUI(user) {
    document.getElementById('profile-username').textContent = user.login;
    document.getElementById('profile-login').textContent = user.login;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('about-me-text').textContent = user.aboutMe || 'Пока ничего не указано';
    
    // Устанавливаем аватарку
    const avatarUrl = user.avatar_url || '/images/default-avatar.png';
    document.getElementById('profile-avatar').src = 
        avatarUrl.startsWith('http') ? avatarUrl : `http://5.129.203.13:5001${avatarUrl}`;
}

function setupAvatarUpload() {
    const changeAvatarBtn = document.getElementById('change-avatar');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            document.getElementById('avatar-input').click();
        });
    }
}

});