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