#include "Enemy.h"
#include <cstdlib>
#include <ctime>
#include <iostream>

// === СТАТИЧЕСКИЕ ПЕРЕМЕННЫЕ (одни на все экземпляры) ===
sf::Texture Enemy::enemyTexture;
bool Enemy::textureLoaded = false;

// === КЛАСС ENEMY ===
Enemy::Enemy(float x, float y) : position(x, y) {
    // Загружаем текстуру только один раз для всех врагов
    if (!textureLoaded) {
        if (enemyTexture.loadFromFile("Slime_green.png")) {
            enemyTexture.setSmooth(false);  // Чёткие пиксели
            textureLoaded = true;
            std::cout << "Enemy texture loaded!" << std::endl;
        }
        else {
            std::cout << "ERROR: Could not load Slime_green.png!" << std::endl;
            // Создаём запасной красный прямоугольник, если картинка не найдена
            sf::RectangleShape fallback(sf::Vector2f(32.f, 48.f));
            fallback.setFillColor(sf::Color(180, 50, 50));
        }
    }

    // Настраиваем спрайт
    sprite.setTexture(enemyTexture);
    sprite.setPosition(position);
    sprite.setScale(1.0f, 1.0f);  // Если нужно увеличить — поставим 2.0f
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
void EnemyManager::spawnRandomEnemies(int count) {
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    enemies.clear();

    for (int i = 0; i < count; ++i) {
        // Случайная позиция с отступом от стен 100px
        float x = 100.f + static_cast<float>(std::rand() % 824);
        float y = 100.f + static_cast<float>(std::rand() % 824);
        enemies.emplace_back(x, y);
    }
}

void EnemyManager::drawAll(sf::RenderWindow& window) {
    for (auto& enemy : enemies) {
        enemy.draw(window);
    }
}
