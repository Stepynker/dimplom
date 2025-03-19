const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Замени на своего пользователя MySQL
    password: 'qazwsxedc1234rfvtgb1234', // Замени на свой пароль
    database: 'litlinks',
});

connection.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к MySQL:', err);
    } else {
        console.log('Подключение к MySQL успешно!');
    }
});

module.exports = connection;