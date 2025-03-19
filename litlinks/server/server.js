const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connection = require('./db/connection');
const mysql = require('mysql2');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000', // Укажите ваш фронтенд-адрес
    credentials: true
}));


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
        SELECT books.*, genres.name as genre 
        FROM books 
        JOIN bookmarks ON books.id = bookmarks.book_id 
        JOIN genres ON books.genre_id = genres.id
        WHERE bookmarks.user_id = ?
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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Определяем папку для сохранения файла
        const folder = req.url.includes('avatar') ? 'public/images/avatars' : 'public/images/covers';
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Имя файла
    }
});

const upload = multer({ storage: storage });


// Endpoint для загрузки аватарки
app.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    const avatarUrl = `/images/avatars/${req.file.filename}`;
    res.json({ avatarUrl });
});

// Endpoint для загрузки обложки книги
app.post('/api/upload-cover', upload.single('cover'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    const coverUrl = `/images/covers/${req.file.filename}`;
    res.json({ coverUrl });
});