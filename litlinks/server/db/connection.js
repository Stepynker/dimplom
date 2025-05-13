const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', // Используем переменную окружения или localhost для разработки
    user: process.env.DB_USER || 'lit', // Переменная окружения или значение по умолчанию
    password: process.env.DB_PASSWORD || '123', // Переменная окружения или значение по умолчанию
    database: process.env.DB_NAME || 'litlinks', // Переменная окружения или значение по умолчанию
    port: process.env.DB_PORT || 3306, // Порт (по умолчанию 3306)
});

connection.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к MySQL:', err);
    } else {
        console.log('Подключение к MySQL успешно!');
    }
});

module.exports = connection;