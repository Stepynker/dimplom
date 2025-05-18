document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.endsWith('upload.html')) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
            alert('Авторизуйтесь перед добавлением книги!');
            window.location.href = 'index.html';
            return;
        }

        // Загружаем список жанров
        try {
            const response = await fetch('http://5.129.203.13:5001/api/genres');
            const genres = await response.json();
            
            const genreSelect = document.getElementById('genre');
            genreSelect.innerHTML = '<option value="">Выберите жанр</option>' + 
                genres.map(genre => `<option value="${genre.id}">${genre.name}</option>`).join('');
        } catch (error) {
            console.error('Ошибка загрузки жанров:', error);
        }

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
                    genre_id: document.getElementById('genre').value,
                    user_id: currentUser.id
                };

                try {
                    const response = await fetch('http://5.129.203.13:5001/api/books/upload', {
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