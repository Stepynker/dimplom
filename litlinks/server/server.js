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
        cb(null, 'public/images/avatars');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });
const path = require('path');
const fs = require('fs');

// Обработчик загрузки аватарки
app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'Файл не был загружен' 
            });
        }

        const avatarUrl = `/images/avatars/${req.file.filename}`;
        const userId = req.body.userId;

        if (!userId) {
            // Удаляем загруженный файл, если нет userId
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                success: false,
                error: 'Не указан ID пользователя' 
            });
        }

        // Обновляем аватар в базе данных
        const updateQuery = 'UPDATE users SET avatar_url = ? WHERE id = ?';
        connection.query(updateQuery, [avatarUrl, userId], (err, results) => {
            if (err) {
                console.error('Ошибка обновления аватара:', err);
                // Удаляем загруженный файл при ошибке
                fs.unlinkSync(req.file.path);
                return res.status(500).json({ 
                    success: false,
                    error: 'Ошибка сервера' 
                });
            }

            res.json({ 
                success: true,
                avatarUrl: `http://5.129.203.13:5001${avatarUrl}`
            });
        });

    } catch (error) {
        console.error('Ошибка загрузки аватарки:', error);
        if (req.file) {
            // Удаляем загруженный файл при ошибке
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false,
            error: 'Внутренняя ошибка сервера' 
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
app.get('/api/notifications/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT 
            n.*, 
            u.login as sender_login,
            b.title as book_title,
            b.cover_url,
            er.id as exchange_request_id,
            er.status as exchange_status
        FROM notifications n
        LEFT JOIN users u ON n.source_id = u.id
        LEFT JOIN books b ON n.book_id = b.id
        LEFT JOIN exchange_requests er ON n.exchange_request_id = er.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
    `;
    
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка получения уведомлений:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        results.forEach(notif => {
            if (notif.cover_url && !notif.cover_url.startsWith('http')) {
                notif.cover_url = `http://5.129.203.13:5001${notif.cover_url}`;
            }
        });
        
        res.json(results);
    });
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
    try {
        const { requesterId, ownerId, bookId, message } = req.body;

        // Проверяем существование книги
        const [bookCheck] = await connection.promise().query(
            'SELECT title FROM books WHERE id = ?', 
            [bookId]
        );
        
        if (bookCheck.length === 0) {
            return res.status(404).json({ error: 'Книга не найдена' });
        }

        // Проверяем, что пользователь не отправляет запрос сам себе
        if (requesterId === ownerId) {
            return res.status(400).json({ error: 'Нельзя отправить запрос самому себе' });
        }

        // Проверяем, что владелец действительно владеет книгой
        const [ownerCheck] = await connection.promise().query(
            'SELECT 1 FROM book_owners WHERE user_id = ? AND book_id = ?',
            [ownerId, bookId]
        );
        
        if (ownerCheck.length === 0) {
            return res.status(400).json({ error: 'Указанный пользователь не владеет этой книгой' });
        }

        // Создаем запрос на обмен
        const [exchangeResult] = await connection.promise().query(
            `INSERT INTO exchange_requests 
            (requester_id, owner_id, book_id, message, status) 
            VALUES (?, ?, ?, ?, 'pending')`,
            [requesterId, ownerId, bookId, message]
        );

        // Создаем уведомление для владельца с привязкой к запросу
        await connection.promise().query(
            `INSERT INTO notifications 
            (user_id, source_id, book_id, exchange_request_id, type, message, is_read) 
            VALUES (?, ?, ?, ?, 'exchange_request', ?, false)`,
            [ownerId, requesterId, bookId, exchangeResult.insertId, 
             `Новый запрос на обмен: ${bookCheck[0].title}`]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка создания запроса обмена:', error);
        res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            details: error.message 
        });
    }
});
app.post('/api/exchange/accept', async (req, res) => {
    try {
        const { requestId, userId, notificationId } = req.body;

        // 1. Проверяем существование запроса
        const [request] = await connection.promise().query(
            'SELECT * FROM exchange_requests WHERE id = ? AND status = "pending"',
            [requestId]
        );
        
        if (request.length === 0) {
            // Помечаем уведомление как неактуальное
            if (notificationId) {
                await connection.promise().query(
                    'UPDATE notifications SET is_read = true WHERE id = ?',
                    [notificationId]
                );
            }
            return res.status(404).json({ error: 'Запрос не найден или уже обработан' });
        }

        const exchangeRequest = request[0];

        // 2. Проверяем права пользователя
        if (exchangeRequest.owner_id !== userId) {
            return res.status(403).json({ error: 'Нет прав для выполнения этого действия' });
        }

        // 3. Обновляем статус запроса
        await connection.promise().query(
            'UPDATE exchange_requests SET status = "accepted" WHERE id = ?',
            [requestId]
        );

        // 4. Обновляем владельца книги
        await transferBookOwnership(exchangeRequest.book_id, exchangeRequest.requester_id, exchangeRequest.owner_id);

        // 5. Создаем уведомление для инициатора
        const [book] = await connection.promise().query(
            'SELECT title FROM books WHERE id = ?',
            [exchangeRequest.book_id]
        );

        await connection.promise().query(
            `INSERT INTO notifications 
            (user_id, source_id, book_id, type, message, is_read) 
            VALUES (?, ?, ?, 'exchange_accepted', ?, false)`,
            [
                exchangeRequest.requester_id,
                userId,
                exchangeRequest.book_id,
                `Ваш запрос на обмен книги "${book[0].title}" принят`
            ]
        );

        // 6. Помечаем исходное уведомление как прочитанное
        if (notificationId) {
               await connection.promise().query(
    'DELETE FROM notifications WHERE id = ?',
    [notificationId]
);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка принятия запроса:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
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
app.get('/api/notifications/:id/full', (req, res) => {
    const query = `
        SELECT 
            n.*, 
            er.id as exchange_request_id,
            er.status as exchange_status,
            er.requester_id,
            er.owner_id,
            er.book_id
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
app.post('/api/exchange/reject', async (req, res) => {
    try {
        const { requestId, userId, notificationId } = req.body;

        // 1. Проверяем существование запроса
        const [request] = await connection.promise().query(
            'SELECT * FROM exchange_requests WHERE id = ? AND status = "pending"',
            [requestId]
        );
        
        if (request.length === 0) {
            // Помечаем уведомление как прочитанное
            if (notificationId) {
                await connection.promise().query(
                    'UPDATE notifications SET is_read = true WHERE id = ?',
                    [notificationId]
                );
            }
            return res.status(404).json({ error: 'Запрос не найден или уже обработан' });
        }

        const exchangeRequest = request[0];

        // 2. Проверяем права пользователя
        if (exchangeRequest.owner_id !== userId) {
            return res.status(403).json({ error: 'Нет прав для выполнения этого действия' });
        }

        // 3. Обновляем статус запроса
        await connection.promise().query(
            'UPDATE exchange_requests SET status = "rejected" WHERE id = ?',
            [requestId]
        );

        // 4. Создаем уведомление для инициатора
        const [book] = await connection.promise().query(
            'SELECT title FROM books WHERE id = ?',
            [exchangeRequest.book_id]
        );

        await connection.promise().query(
            `INSERT INTO notifications 
            (user_id, source_id, book_id, type, message, is_read) 
            VALUES (?, ?, ?, 'exchange_rejected', ?, false)`,
            [
                exchangeRequest.requester_id,
                userId,
                exchangeRequest.book_id,
                `Ваш запрос на обмен книги "${book[0].title}" отклонен`
            ]
        );

        // 5. Удаляем исходное уведомление
        if (notificationId) {
            await connection.promise().query(
                'DELETE FROM notifications WHERE id = ?',
                [notificationId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка отклонения запроса:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});
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