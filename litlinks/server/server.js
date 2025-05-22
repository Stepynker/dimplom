const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connection = require('./db/connection');
const mysql = require('mysql2');

const app = express();
const PORT =  process.env.PORT || 5001;

const dbConfig = {
  host: '127.0.0.1',
  user: 'litlinks_user',       // Используйте нового пользователя
  password: '123', // Пароль, который задали выше
  database: 'litlinks',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: [
    'http://5.129.203.13',
    'http://localhost',
    'http://localhost:3000',
    'http://5.129.203.13:80',
    'http://5.129.203.13:5001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
// Раздача статических файлов
app.use(express.static('../public'));

// Регистрация
app.post('/api/register', (req, res) => {
    const { login, email, password } = req.body;

    const query = 'INSERT INTO users (login, email, password) VALUES (?, ?, ?)';
    connection.query(query, [login, email, password], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ message: 'Логин или email уже заняты' });
            } else {
                res.status(500).json({ message: 'Ошибка регистрации', error: err });
            }
        } else {
            res.status(201).json({ message: 'Регистрация успешна!' });
        }
    });
});

// Вход
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    const query = 'SELECT * FROM users WHERE login = ? AND password = ?';
    connection.query(query, [login, password], (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Ошибка входа', error: err });
        } else if (results.length > 0) {
            const user = results[0];
            res.status(200).json({ message: 'Вход выполнен!', user });
        } else {
            res.status(400).json({ message: 'Неверный логин или пароль' });
        }
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

//УДАЛЕНИЕ КООРДИНАТ ЗАКЛАДОК
app.delete('/api/bookmarks', (req, res) => {
    const { userId, bookId } = req.body; // Извлекаем userId и bookId из тела запроса
    console.log('Получен запрос на удаление закладки:', { userId, bookId });

    if (!userId || !bookId) {
        console.error('Ошибка: не переданы userId или bookId');
        return res.status(400).json({ error: 'Необходимы userId и bookId' });
    }

    const query = 'DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?';
    connection.query(query, [userId, bookId], (err, results) => {
        if (err) {
            console.error('Ошибка при удалении из закладок:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Закладка не найдена' });
        }
        res.json({ message: 'Книга удалена из закладок' });
    });
}); 

// API для получения списка книг
app.get('/api/books', (req, res) => {
    const query = 'SELECT * FROM books';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении книг:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
            return;
        }
        res.json(results);
    });
});
//ДОБАВЛЕНИЕ ЗАКЛАДКИ В ДАРКНЕТ
app.post('/api/bookmarks', (req, res) => {
    console.log('Получен запрос на добавление в закладки:', req.body);

    const { userId, bookId } = req.body;

    if (!userId || !bookId) {
        console.error('Ошибка: не переданы userId или bookId');
        return res.status(400).json({ error: 'Необходимы userId и bookId' });
    }

    // Проверяем, есть ли уже такая закладка у пользователя
    const checkQuery = 'SELECT * FROM bookmarks WHERE user_id = ? AND book_id = ?';
    connection.query(checkQuery, [userId, bookId], (err, results) => {
        if (err) {
            console.error('Ошибка при проверке закладки:', err);
            return res.status(500).json({ error: 'Ошибка сервера', details: err });
        }

        if (results.length > 0) {
            // Если закладка уже существует, возвращаем сообщение
            return res.status(200).json({ message: 'Книга уже добавлена в закладки' });
        }

        // Если закладки нет, добавляем её
        const insertQuery = 'INSERT INTO bookmarks (user_id, book_id) VALUES (?, ?)';
        connection.query(insertQuery, [userId, bookId], (err, results) => {
            if (err) {
                console.error('Ошибка при добавлении в закладки:', err);
                return res.status(500).json({ error: 'Ошибка сервера', details: err });
            }
            res.json({ message: 'Книга добавлена в закладки' });
        });
    });
});
//ПОЛУЧЕНИЕ ЗАКЛАДОК ПОЛЬЗОВАТЕЛЯ
app.get('/api/bookmarks/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT books.*, GROUP_CONCAT(genres.name) as genres 
        FROM books 
        JOIN bookmarks ON books.id = bookmarks.book_id 
        LEFT JOIN book_genres ON books.id = book_genres.book_id
        LEFT JOIN genres ON book_genres.genre_id = genres.id
        WHERE bookmarks.user_id = ?
        GROUP BY books.id
    `;
    
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении закладок:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.json(results);
    });
});

app.get('/api/books', (req, res) => {
    const query = 'SELECT * FROM books';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении книг:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/update-about-me', (req, res) => {
    const { userId, aboutMe } = req.body;

    const query = 'UPDATE users SET aboutMe = ? WHERE id = ?';
    connection.query(query, [aboutMe, userId], (err, results) => {
        if (err) {
            console.error('Ошибка при обновлении информации:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        res.json({ message: 'Информация о себе успешно обновлена!' });
    });
});


// ЭТО ЕСЛИ ЧТО ОБНОВА ОБЛОЖКИ И АВАТАРОК ДЛЯ САЙТАААААА!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const multer = require('multer');

// Настройка хранилища для загружаемых файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/images/avatars');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
})

const upload = multer({ storage: storage });
const path = require('path');
const fs = require('fs');

const avatarsDir = path.join(__dirname, '../public/images/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
// Обработчик загрузки аватарки
app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'Файл не был загружен' 
            });
        }

        // Проверяем MIME-тип файла
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(req.file.mimetype)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                success: false,
                error: 'Разрешены только JPG, PNG и GIF изображения' 
            });
        }

        const avatarUrl = `/images/avatars/${req.file.filename}`;
        const userId = req.body.userId;

        if (!userId) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                success: false,
                error: 'Не указан ID пользователя' 
            });
        }

        // Обновляем аватар в базе данных
        const updateQuery = 'UPDATE users SET avatar_url = ? WHERE id = ?';
        await connection.promise().query(updateQuery, [avatarUrl, userId]);

        res.json({ 
            success: true,
            avatarUrl: `http://5.129.203.13:5001${avatarUrl}`
        });

    } catch (error) {
        console.error('Ошибка загрузки аватарки:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('Ошибка удаления файла:', e);
            }
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Внутренняя ошибка сервера',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});
// Endpoint для загрузки обложки книги
app.post('/api/upload-cover', upload.single('cover'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    const coverUrl = `/images/covers/${req.file.filename}`;
    res.json({ coverUrl });
});

// Поиск книг
app.get('/api/search/books', (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Минимальная длина запроса - 2 символа' });
    }

    const searchQuery = `
        SELECT * FROM books 
        WHERE title LIKE ? OR author LIKE ?
        LIMIT 10
    `;
    const searchValue = `%${query}%`;
    
    connection.query(searchQuery, [searchValue, searchValue], (err, results) => {
        if (err) {
            console.error('Ошибка поиска книг:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.json(results);
    });
});

// Поиск пользователей
app.get('/api/search/users', (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Минимальная длина запроса - 2 символа' });
    }

    const searchQuery = `
        SELECT id, login, avatar_url FROM users 
        WHERE login LIKE ?
        LIMIT 10
    `;
    const searchValue = `%${query}%`;
    
    connection.query(searchQuery, [searchValue], (err, results) => {
        if (err) {
            console.error('Ошибка поиска пользователей:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.json(results);
    });
});
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    
    const query = `
        SELECT id, login, email, avatar_url, about_me as aboutMe, created_at 
        FROM users 
        WHERE id = ?
    `;
    
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка получения пользователя:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const user = results[0];
        // Добавляем полный URL к аватару, если он есть
        if (user.avatar_url && !user.avatar_url.startsWith('http')) {
            user.avatar_url = `http://5.129.203.13:5001${user.avatar_url}`;
        }
        
        res.json(user);
    });
});
// Добавление в друзья
app.post('/api/friends', (req, res) => {
    const { followerId, followingId } = req.body;
    
    if (followerId === followingId) {
        return res.status(400).json({ error: 'Нельзя добавить самого себя в друзья' });
    }
    
    // Проверяем, не добавлен ли уже пользователь в друзья
    const checkQuery = 'SELECT * FROM followers WHERE follower_id = ? AND following_id = ?';
    connection.query(checkQuery, [followerId, followingId], (err, results) => {
        if (err) {
            console.error('Ошибка проверки друзей:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: 'Этот пользователь уже у вас в друзьях' });
        }
        
        // Добавляем в друзья
        const insertQuery = 'INSERT INTO followers (follower_id, following_id) VALUES (?, ?)';
        connection.query(insertQuery, [followerId, followingId], (err, results) => {
            if (err) {
                console.error('Ошибка добавления в друзья:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            
            // Создаем уведомление
            const notificationQuery = 'INSERT INTO notifications (user_id, type, source_id) VALUES (?, "follow", ?)';
            connection.query(notificationQuery, [followingId, followerId], (err) => {
                if (err) console.error('Ошибка создания уведомления:', err);
            });
            
            res.json({ message: 'Пользователь добавлен в друзья' });
        });
    });
});

app.get('/api/friends/check', (req, res) => {
    const { followerId, followingId } = req.query;
    
    const query = 'SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ? LIMIT 1';
    connection.query(query, [followerId, followingId], (err, results) => {
        if (err) {
            console.error('Ошибка проверки друзей:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        res.json(results.length > 0);
    });
});

app.post('/api/books/upload', async (req, res) => {
    const { title, author, description, cover_url, publication_year, genre_id, user_id } = req.body;

    if (!title || !author || !user_id || !genre_id) {
        return res.status(400).json({ error: 'Обязательные поля: title, author, user_id, genre_id' });
    }

    try {
        // Начинаем транзакцию
        await connection.promise().query('START TRANSACTION');

        // 1. Добавляем книгу
        const [bookResult] = await connection.promise().query(
            `INSERT INTO books (title, author, description, cover_url, publication_year)
             VALUES (?, ?, ?, ?, ?)`,
            [title, author, description, cover_url, publication_year]
        );

        const bookId = bookResult.insertId;

        // 2. Добавляем связь книги с жанром
        await connection.promise().query(
            `INSERT INTO book_genres (book_id, genre_id)
             VALUES (?, ?)`,
            [bookId, genre_id]
        );

        // 3. Добавляем владельца книги
        await connection.promise().query(
            `INSERT INTO book_owners (user_id, book_id, is_available)
             VALUES (?, ?, true)`,
            [user_id, bookId]
        );

        // Коммитим транзакцию
        await connection.promise().query('COMMIT');

        res.status(201).json({ 
            message: 'Книга успешно добавлена!', 
            bookId 
        });
    } catch (error) {
        // Откатываем транзакцию при ошибке
        await connection.promise().query('ROLLBACK');
        console.error('Ошибка добавления книги:', error);
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

app.get('/api/genres', (req, res) => {
    const query = 'SELECT * FROM genres';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении жанров:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
            return;
        }
        res.json(results);
    });
});




app.get('/api/books/:id', (req, res) => {
    const bookId = req.params.id;
    
    const query = `
        SELECT b.*, bo.user_id as owner_id 
        FROM books b
        LEFT JOIN book_owners bo ON b.id = bo.book_id
        WHERE b.id = ?
        LIMIT 1
    `;
    
    connection.query(query, [bookId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Книга не найдена' });
        }
        
        const book = results[0];
        // Добавляем полный URL к обложке, если она есть
        if (book.cover_url && !book.cover_url.startsWith('http')) {
            book.cover_url = `http://5.129.203.13:5001${book.cover_url}`;
        }
        
        res.json(book);
    });
});

// Получение владельцев книги
app.get('/api/book-owners/:bookId', (req, res) => {
    const query = 'SELECT user_id, is_available FROM book_owners WHERE book_id = ? AND is_available = true';
    connection.query(query, [req.params.bookId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка получения владельцев' });
        res.json(results);
    });
});


app.get('/api/user-books/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT b.* FROM books b
        JOIN book_owners bo ON b.id = bo.book_id
        WHERE bo.user_id = ?
    `;
    
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка получения книг пользователя:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.json(results);
    });
});
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const query = `
            SELECT 
                n.id,
                n.user_id,
                n.type,
                n.message,
                n.source_id,
                n.book_id,
                n.is_read,
                n.created_at,
                n.exchange_request_id,
                n.offered_book_id,
                n.offered_book_title,
                n.requested_book_id,
                n.requested_book_title,
                u.login as sender_login,
                b.title as book_title,
                b.cover_url,
                er.status as exchange_status
            FROM notifications n
            LEFT JOIN users u ON n.source_id = u.id
            LEFT JOIN books b ON n.book_id = b.id
            LEFT JOIN exchange_requests er ON n.exchange_request_id = er.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
        `;
        
        const [results] = await connection.promise().query(query, [userId]);
        
        res.json(results);
    } catch (error) {
        console.error('Ошибка получения уведомлений:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера',
            details: error.message 
        });
    }
});

// Пометка уведомления как прочитанного
app.put('/api/notifications/:id/read', (req, res) => {
    const query = 'UPDATE notifications SET is_read = true WHERE id = ?';
    connection.query(query, [req.params.id], (err) => {
        if (err) {
            console.error('Ошибка обновления уведомления:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.json({ success: true });
    });
});
app.post('/api/exchange-request', async (req, res) => {
    console.log('Получен запрос на обмен:', JSON.stringify(req.body, null, 2));
    
    try {
        const { requesterId, ownerId, bookId, userBookId, message } = req.body;

        // Проверка обязательных полей
        if (!requesterId || !ownerId || !bookId || !userBookId) {
            console.error('Отсутствуют обязательные поля');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Проверка, что пользователь не отправляет запрос сам себе
        if (requesterId === ownerId) {
            return res.status(400).json({ error: 'Cannot exchange with yourself' });
        }

        // Начинаем транзакцию
        await connection.promise().query('START TRANSACTION');

        // 1. Проверяем существование книг
        const [books] = await connection.promise().query(
            'SELECT id, title FROM books WHERE id IN (?, ?)',
            [bookId, userBookId]
        );

        if (books.length !== 2) {
            await connection.promise().query('ROLLBACK');
            return res.status(404).json({ 
                error: 'One or both books not found',
                booksFound: books.length
            });
        }

        const targetBook = books.find(b => b.id == bookId);
        const offeredBook = books.find(b => b.id == userBookId);

        // 2. Проверяем владение книгой
        const [ownership] = await connection.promise().query(
            'SELECT 1 FROM book_owners WHERE user_id = ? AND book_id = ?',
            [requesterId, userBookId]
        );

        if (!ownership.length) {
            await connection.promise().query('ROLLBACK');
            return res.status(403).json({ 
                error: 'User does not own the offered book',
                userBookId: userBookId
            });
        }

        // 3. Проверяем доступность книги
        const [availability] = await connection.promise().query(
            'SELECT 1 FROM book_owners WHERE user_id = ? AND book_id = ? AND is_available = 1',
            [ownerId, bookId]
        );

        if (!availability.length) {
            await connection.promise().query('ROLLBACK');
            return res.status(403).json({ 
                error: 'Requested book not available for exchange',
                bookId: bookId
            });
        }

        // 4. Создаем запрос на обмен
        const [exchangeResult] = await connection.promise().query(
            `INSERT INTO exchange_requests 
            (requester_id, owner_id, requested_book_id, offered_book_id, status) 
            VALUES (?, ?, ?, ?, 'pending')`,
            [requesterId, ownerId, bookId, userBookId]
        );

        // 5. Создаем уведомление для владельца
        await connection.promise().query(
            `INSERT INTO notifications 
            (user_id, source_id, book_id, exchange_request_id, type,
             offered_book_id, offered_book_title,
             requested_book_id, requested_book_title,
             message, is_read) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                ownerId, 
                requesterId, 
                bookId, 
                exchangeResult.insertId,
                'exchange_request',
                userBookId,
                offeredBook.title,
                bookId,
                targetBook.title,
                message || `Запрос на обмен "${offeredBook.title}" на "${targetBook.title}"`
            ]
        );

        await connection.promise().query('COMMIT');
        
        console.log('Успешно создан запрос на обмен:', exchangeResult.insertId);
        res.json({ 
            success: true,
            exchangeId: exchangeResult.insertId
        });

    } catch (error) {
        await connection.promise().query('ROLLBACK');
        console.error('Ошибка в обработчике exchange-request:', error.stack);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

app.get('/api/notifications/:userId/unread-count', (req, res) => {
    const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false';
    connection.query(query, [req.params.userId], (err, results) => {
        if (err) {
            console.error('Ошибка получения счетчика уведомлений:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.json({ count: results[0].count });
    });
});


app.post('/api/exchange/accept', async (req, res) => {
    try {
        const { notificationId, userId } = req.body;
        
        // 1. Получаем полные данные уведомления
        const [notification] = await connection.promise().query(
            `SELECT n.*, er.requester_id, er.requested_book_id, er.offered_book_id
             FROM notifications n
             JOIN exchange_requests er ON n.exchange_request_id = er.id
             WHERE n.id = ? AND n.user_id = ?`,
            [notificationId, userId]
        );
        
        if (!notification.length) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }
        
        const exchange = notification[0];

        // 2. Начинаем транзакцию
        await connection.promise().query('START TRANSACTION');

        // 3. Обновляем статус запроса
        await connection.promise().query(
            `UPDATE exchange_requests SET status = 'accepted' 
             WHERE id = ?`,
            [exchange.exchange_request_id]
        );

        // 4. Передаем книги между пользователями
        // Удаляем у текущего владельца
        await connection.promise().query(
            `DELETE FROM book_owners 
             WHERE user_id = ? AND book_id = ?`,
            [userId, exchange.requested_book_id]
        );
        
        // Добавляем новому владельцу
        await connection.promise().query(
            `INSERT INTO book_owners (user_id, book_id, is_available)
             VALUES (?, ?, TRUE)`,
            [exchange.requester_id, exchange.requested_book_id]
        );

        // Удаляем у инициатора обмена
        await connection.promise().query(
            `DELETE FROM book_owners 
             WHERE user_id = ? AND book_id = ?`,
            [exchange.requester_id, exchange.offered_book_id]
        );
        
        // Добавляем текущему пользователю
        await connection.promise().query(
            `INSERT INTO book_owners (user_id, book_id, is_available)
             VALUES (?, ?, TRUE)`,
            [userId, exchange.offered_book_id]
        );

        // 5. Удаляем уведомление
        await connection.promise().query(
            `DELETE FROM notifications WHERE id = ?`,
            [notificationId]
        );

        // 6. Создаем уведомление для инициатора
        await connection.promise().query(
            `INSERT INTO notifications 
             (user_id, source_id, type, message, book_id, exchange_request_id)
             VALUES (?, ?, 'exchange_accepted', ?, ?, ?)`,
            [
                exchange.requester_id,
                userId,
                `Ваш запрос на обмен принят`,
                exchange.requested_book_id,
                exchange.exchange_request_id
            ]
        );

        await connection.promise().query('COMMIT');
        res.json({ success: true });

    } catch (error) {
        await connection.promise().query('ROLLBACK');
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/api/exchange/reject', async (req, res) => {
    try {
        const { notificationId, userId } = req.body;
        
        // 1. Получаем данные уведомления
        const [notification] = await connection.promise().query(
            `SELECT n.*, er.requester_id, er.requested_book_id, er.offered_book_id
             FROM notifications n
             JOIN exchange_requests er ON n.exchange_request_id = er.id
             WHERE n.id = ? AND n.user_id = ?`,
            [notificationId, userId]
        );
        
        if (!notification.length) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }
        
        const exchange = notification[0];

        // 2. Начинаем транзакцию
        await connection.promise().query('START TRANSACTION');

        // 3. Обновляем статус запроса
        await connection.promise().query(
            `UPDATE exchange_requests SET status = 'rejected' 
             WHERE id = ?`,
            [exchange.exchange_request_id]
        );

        // 4. Удаляем уведомление
        await connection.promise().query(
            `DELETE FROM notifications WHERE id = ?`,
            [notificationId]
        );

        // 5. Создаем уведомление для инициатора
        await connection.promise().query(
            `INSERT INTO notifications 
             (user_id, source_id, type, message, book_id, exchange_request_id)
             VALUES (?, ?, 'exchange_rejected', ?, ?, ?)`,
            [
                exchange.requester_id,
                userId,
                `Ваш запрос на обмен отклонен`,
                exchange.requested_book_id,
                exchange.exchange_request_id
            ]
        );

        await connection.promise().query('COMMIT');
        res.json({ success: true });

    } catch (error) {
        await connection.promise().query('ROLLBACK');
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Отклонение обмена
app.post('/api/exchange/reject', async (req, res) => {
    const { requestId, userId, notificationId } = req.body;
    console.log('Reject exchange request:', { requestId, userId, notificationId });

    try {
        // 1. Проверяем существование запроса
        const [request] = await connection.promise().query(
            `SELECT er.*, 
             rb.title as requested_title, 
             ob.title as offered_title
             FROM exchange_requests er
             JOIN books rb ON er.requested_book_id = rb.id
             JOIN books ob ON er.offered_book_id = ob.id
             WHERE er.id = ? AND er.status = 'pending'`,
            [requestId]
        );

        if (request.length === 0) {
            console.error('Exchange request not found or already processed');
            return res.status(404).json({ error: 'Запрос не найден или уже обработан' });
        }

        const exchange = request[0];

        // 2. Проверяем права пользователя
        if (exchange.owner_id !== parseInt(userId)) {
            console.error('User does not have permission to reject this exchange');
            return res.status(403).json({ error: 'Нет прав для выполнения этого действия' });
        }

        // 3. Начинаем транзакцию
        await connection.promise().query('START TRANSACTION');

        // 4. Обновляем статус запроса
        await connection.promise().query(
            'UPDATE exchange_requests SET status = "rejected" WHERE id = ?',
            [requestId]
        );

        // 5. Обновляем уведомление
        await connection.promise().query(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            [notificationId]
        );

        // 6. Создаем уведомление для инициатора
        await connection.promise().query(
            `INSERT INTO notifications 
            (user_id, source_id, book_id, type, message, is_read) 
            VALUES (?, ?, ?, 'exchange_rejected', ?, 0)`,
            [
                exchange.requester_id,
                userId,
                exchange.requested_book_id,
                `Ваш запрос на обмен "${exchange.offered_title}" на "${exchange.requested_title}" отклонен`
            ]
        );

        await connection.promise().query('COMMIT');

        console.log('Exchange successfully rejected');
        res.json({ success: true });

    } catch (error) {
        await connection.promise().query('ROLLBACK');
        console.error('Error rejecting exchange:', error.stack);
        res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});


// Функция для передачи прав на книгу
async function transferBookOwnership(bookId, newOwnerId, previousOwnerId) {
    // 1. Удаляем старого владельца
    await connection.promise().query(
        'DELETE FROM book_owners WHERE book_id = ? AND user_id = ?',
        [bookId, previousOwnerId]
    );
    
    // 2. Добавляем нового владельца
    await connection.promise().query(
        'INSERT INTO book_owners (user_id, book_id, is_available) VALUES (?, ?, true)',
        [newOwnerId, bookId]
    );
    
    // 3. Добавляем запись в историю обменов
    await connection.promise().query(
        `INSERT INTO exchange_history 
        (book_id, previous_owner_id, new_owner_id, exchange_date) 
        VALUES (?, ?, ?, NOW())`,
        [bookId, previousOwnerId, newOwnerId]
    );
}
app.get('/api/exchange-history/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const query = `
            SELECT eh.*, b.title as book_title, b.cover_url,
                   pu.login as previous_owner_login,
                   nu.login as new_owner_login
            FROM exchange_history eh
            JOIN books b ON eh.book_id = b.id
            JOIN users pu ON eh.previous_owner_id = pu.id
            JOIN users nu ON eh.new_owner_id = nu.id
            WHERE eh.previous_owner_id = ? OR eh.new_owner_id = ?
            ORDER BY eh.exchange_date DESC
        `;
        
        const [results] = await connection.promise().query(query, [userId, userId]);
        res.json(results);
    } catch (error) {
        console.error('Ошибка получения истории обменов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
app.get('/api/notifications/single/:id', (req, res) => {
    const query = `
        SELECT n.*, er.id as exchange_request_id
        FROM notifications n
        LEFT JOIN exchange_requests er ON n.exchange_request_id = er.id
        WHERE n.id = ?
    `;
    
    connection.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.error('Ошибка получения уведомления:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }
        
        res.json(results[0]);
    });
});
app.get('/api/notifications/:id/full', async (req, res) => {
    try {
        const query = `
            SELECT 
                n.*,
                er.requested_book_id,
                er.offered_book_id,
                b1.title as requested_book_title,
                b2.title as offered_book_title,
                u.login as sender_login
            FROM notifications n
            LEFT JOIN exchange_requests er ON n.exchange_request_id = er.id
            LEFT JOIN books b1 ON er.requested_book_id = b1.id
            LEFT JOIN books b2 ON er.offered_book_id = b2.id
            LEFT JOIN users u ON n.source_id = u.id
            WHERE n.id = ?
        `;
        
        const [results] = await connection.promise().query(query, [req.params.id]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }
        
        const notification = results[0];
        
        // Проверка наличия названий книг
        if (!notification.requested_book_title || !notification.offered_book_title) {
            console.error('Отсутствуют названия книг в уведомлении:', notification);
            return res.status(500).json({ error: 'Неполные данные книг' });
        }
        
        res.json(notification);
    } catch (error) {
        console.error('Ошибка получения уведомления:', error);
        res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});
app.post('/api/exchange/reject', async (req, res) => {
    try {
        const { requestId, userId, notificationId } = req.body;

        // Проверяем существование запроса
        const [request] = await connection.promise().query(
            'SELECT * FROM exchange_requests WHERE id = ? AND status = "pending"',
            [requestId]
        );
        
        if (request.length === 0) {
            return res.status(404).json({ error: 'Запрос не найден или уже обработан' });
        }

        const exchange = request[0];

        // Проверяем права пользователя
        if (exchange.owner_id !== userId) {
            return res.status(403).json({ error: 'Нет прав для выполнения этого действия' });
        }

        // Начинаем транзакцию
        await connection.promise().query('START TRANSACTION');

        // 1. Обновляем статус запроса
        await connection.promise().query(
            'UPDATE exchange_requests SET status = "rejected" WHERE id = ?',
            [requestId]
        );

        // 2. Помечаем уведомление как прочитанное
        await connection.promise().query(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            [notificationId]
        );

const message = `Пользователь ${user.login} принял ваш запрос на обмен "${offeredBook[0].title}" на "${requestedBook[0].title}"`;

if (!offeredBook[0]?.title || !requestedBook[0]?.title) {
    console.error('Не найдены названия книг:', {
        offered: exchange.offered_book_id,
        requested: exchange.requested_book_id
    });
    throw new Error('Не удалось получить названия книг');
}

        // 3. Создаем уведомление для инициатора
        const [book] = await connection.promise().query(
            'SELECT title FROM books WHERE id = ?',
            [exchange.requested_book_id]
        );

        await connection.promise().query(
            `INSERT INTO notifications 
            (user_id, source_id, book_id, type, message, is_read) 
            VALUES (?, ?, ?, 'exchange_rejected', ?, 0)`,
            [
                exchange.requester_id,
                userId,
                exchange.requested_book_id,
                `Ваш запрос на обмен отклонен (книга "${book[0].title}")`
            ]
        );

        await connection.promise().query('COMMIT');

        res.json({ success: true });

    } catch (error) {
        await connection.promise().query('ROLLBACK');
        console.error('Ошибка отклонения обмена:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Функция передачи прав на книгу
async function transferBookOwnership(bookId, newOwnerId, previousOwnerId) {
    // 1. Удаляем старого владельца
    await connection.promise().query(
        'DELETE FROM book_owners WHERE book_id = ? AND user_id = ?',
        [bookId, previousOwnerId]
    );
    
    // 2. Добавляем нового владельца
    await connection.promise().query(
        'INSERT INTO book_owners (user_id, book_id, is_available) VALUES (?, ?, true)',
        [newOwnerId, bookId]
    );
    
    // 3. Добавляем запись в историю обменов
    await connection.promise().query(
        `INSERT INTO exchange_history 
        (book_id, previous_owner_id, new_owner_id, exchange_date) 
        VALUES (?, ?, ?, NOW())`,
        [bookId, previousOwnerId, newOwnerId]
    );
}
app.delete('/api/books', async (req, res) => {
    const { user_id, book_id } = req.body;

    if (!user_id || !book_id) {
        return res.status(400).json({ error: 'Необходимы user_id и book_id' });
    }

    try {
        // Проверяем, является ли пользователь владельцем книги
        const [ownerCheck] = await connection.promise().query(
            'SELECT 1 FROM book_owners WHERE user_id = ? AND book_id = ?',
            [user_id, book_id]
        );

        if (ownerCheck.length === 0) {
            return res.status(403).json({ error: 'Вы не владеете этой книгой' });
        }

        // Начинаем транзакцию
        await connection.promise().query('START TRANSACTION');

        // 1. Удаляем связи книги с жанрами
        await connection.promise().query(
            'DELETE FROM book_genres WHERE book_id = ?',
            [book_id]
        );

        // 2. Удаляем связи книги с закладками
        await connection.promise().query(
            'DELETE FROM bookmarks WHERE book_id = ?',
            [book_id]
        );

        // 3. Удаляем владельцев книги
        await connection.promise().query(
            'DELETE FROM book_owners WHERE book_id = ?',
            [book_id]
        );

        // 4. Удаляем саму книгу
        const [deleteResult] = await connection.promise().query(
            'DELETE FROM books WHERE id = ?',
            [book_id]
        );

        // Коммитим транзакцию
        await connection.promise().query('COMMIT');

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Книга не найдена' });
        }

        res.json({ message: 'Книга успешно удалена' });
    } catch (error) {
        // Откатываем транзакцию при ошибке
        await connection.promise().query('ROLLBACK');
        console.error('Ошибка удаления книги:', error);
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});
