document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию только если мы на странице upload.html
    if (window.location.pathname.endsWith('upload.html')) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
            alert('Авторизуйтесь перед добавлением книги!');
            window.location.href = 'index.html';
            return;
        }

        // Устанавливаем currentUser в глобальную область видимости
        window.currentUser = currentUser;

        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const data = {
                    title: document.getElementById('title').value,
                    author: document.getElementById('author').value,
                    description: document.getElementById('description').value,
                    cover_url: document.getElementById('cover_url').value,
                    publication_year: document.getElementById('year').value,
                    user_id: currentUser.id
                };

                try {
                    const response = await fetch('http://localhost:5000/api/books/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();
                    alert(result.message);

                    if (response.ok) {
                        window.location.href = `book.html?id=${result.bookId}`;
                    }
                } catch (error) {
                    console.error('Ошибка при добавлении книги:', error);
                    alert('Произошла ошибка при добавлении книги');
                }
            });
        }
    }
});