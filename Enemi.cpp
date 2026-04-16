#include "Enemy.h"
#include <cstdlib>
#include <ctime>
#include <iostream>
#include <cmath> // Для sqrt

// === СТАТИЧЕСКИЕ ПЕРЕМЕННЫЕ ===
sf::Texture Enemy::texIdle;
sf::Texture Enemy::texJump;
bool Enemy::texturesLoaded = false;

// === КЛАСС ENEMY ===
Enemy::Enemy(float x, float y, float speed) : position(x, y), moveSpeed(speed) {
    // Загружаем текстуры ОДИН раз
    if (!texturesLoaded) {
        if (texIdle.loadFromFile("slime_idle.png") && texJump.loadFromFile("slime_jump.png")) {
            texIdle.setSmooth(false);
            texJump.setSmooth(false);
            texturesLoaded = true;
            std::cout << "Enemy textures loaded!" << std::endl;
        }
        else {
            std::cout << "ERROR: Could not load slime textures! Check filenames." << std::endl;
        }
    }

    sprite.setTexture(texIdle); // Начинаем с кадра покоя
    sprite.setPosition(position);
    sprite.setScale(1.0f, 1.0f); // Увеличим масштаб, чтобы было видно (подстрой под себя)
}

void Enemy::update(float deltaTime, const sf::Vector2f& playerPos) {
    // 1. Вычисляем вектор направления к игроку
    sf::Vector2f direction = playerPos - position;

    // Длина вектора (расстояние до игрока)
    float length = std::sqrt(direction.x * direction.x + direction.y * direction.y);

    // Если игрок очень близко, не двигаемся (чтобы не дрожать)
    if (length > 5.f) {
        // Нормализуем вектор
        direction /= length;

        // Двигаем врага
        position += direction * moveSpeed * deltaTime;
        sprite.setPosition(position);

        // 2. АНИМАЦИЯ
        animationTimer += deltaTime;
        if (animationTimer >= animationSpeed) {
            // Переключаем кадры: 0 -> 1 -> 0 -> 1...
            currentFrame = (currentFrame + 1) % 2;

            // Применяем текстуру
            if (currentFrame == 0) sprite.setTexture(texIdle);
            else sprite.setTexture(texJump);

            animationTimer = 0.f;
        }
    }
    else {
        // Если стоим, ставим кадр покоя
        sprite.setTexture(texIdle);
        currentFrame = 0;
        animationTimer = 0.f;
    }
}

void Enemy::draw(sf::RenderWindow& window) {
    window.draw(sprite);
}

sf::FloatRect Enemy::getBounds() const {
    return sprite.getGlobalBounds();
}

sf::Vector2f Enemy::getPosition() const {
    return position;
}

// === КЛАСС ENEMYMANAGER ===
void EnemyManager::spawnRandomEnemies(int count, float enemySpeed) {
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    enemies.clear();

    for (int i = 0; i < count; ++i) {
        float x = 100.f + static_cast<float>(std::rand() % 824);
        float y = 100.f + static_cast<float>(std::rand() % 824);
        // Передаём скорость в конструктор
        enemies.emplace_back(x, y, enemySpeed);
    }
}

// Обновление всех врагов
void EnemyManager::updateAll(float deltaTime, const sf::Vector2f& playerPos) {
    for (auto& enemy : enemies) {
        enemy.update(deltaTime, playerPos);
    }
}

void EnemyManager::drawAll(sf::RenderWindow& window) {
    for (auto& enemy : enemies) {
        enemy.draw(window);
    }
}
