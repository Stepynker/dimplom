#include "Plain.h"
#include <iostream>

bool PlainLocation::load() {
    if (!mapTexture.loadFromFile("plain_map.png")) {
        std::cout << "Error: plain_map.png not found!" << std::endl;
        return false;
    }
    mapTexture.setSmooth(false);
    mapSprite.setTexture(mapTexture);
    mapSprite.setPosition(0, 0);

    // Коллизии...
    float wallThickness = 45;
    obstacles.clear();
    sf::RectangleShape top(sf::Vector2f(1024, wallThickness)); top.setPosition(0, 0); top.setFillColor(sf::Color::Transparent); obstacles.push_back(top);
    sf::RectangleShape bottom(sf::Vector2f(1024, wallThickness)); bottom.setPosition(0, 1024 - wallThickness); bottom.setFillColor(sf::Color::Transparent); obstacles.push_back(bottom);
    sf::RectangleShape left(sf::Vector2f(wallThickness, 1024)); left.setPosition(0, 0); left.setFillColor(sf::Color::Transparent); obstacles.push_back(left);
    sf::RectangleShape right(sf::Vector2f(wallThickness, 1024)); right.setPosition(1024 - wallThickness, 0); right.setFillColor(sf::Color::Transparent); obstacles.push_back(right);

    // СПАВНИМ ВРАГОВ со скоростью 100 пикселей в секунду
    enemyManager.spawnRandomEnemies(7, 100.f);
    std::cout << "Spawned 7 enemies on Plain!" << std::endl;

    return true;
}

// НОВАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ
void PlainLocation::update(float deltaTime, const sf::Vector2f& playerPos) {
    enemyManager.updateAll(deltaTime, playerPos);
}

void PlainLocation::draw(sf::RenderWindow& window) {
    window.draw(mapSprite);
    enemyManager.drawAll(window);

    // === РИСУЕМ HP БАРЫ ВРАГОВ ===
    // Текстуры бара (можно использовать те же, что у игрока)
    static sf::Texture barVoidTex, barFillTex;
    static bool loaded = false;
    if (!loaded) {
        barVoidTex.loadFromFile("hp_bar_void.png");
        barFillTex.loadFromFile("hp_bar.png");
        barVoidTex.setSmooth(false);
        barFillTex.setSmooth(false);
        loaded = true;
    }

    // Получаем доступ к врагам
    auto& enemies = enemyManager.getEnemies();
    for (auto& enemy : enemies) {
        if (enemy.getCurrentHP() > 0) {  // Рисуем только живым
            // Позиция: над головой врага
            sf::Vector2f pos = enemy.getPosition();
            float barX = pos.x;
            float barY = pos.y - 25.f;  // Чуть выше врага
            float barScale = 1.0f;       // Меньше чем у игрока

            // Фон (пустота)
            sf::Sprite barVoid(barVoidTex);
            barVoid.setPosition(barX, barY);
            barVoid.setScale(barScale, barScale);
            window.draw(barVoid);

            // Заполнение (красная часть)
            float hpPercent = static_cast<float>(enemy.getCurrentHP()) /
                static_cast<float>(enemy.getMaxHP());
            if (hpPercent < 0.f) hpPercent = 0.f;
            if (hpPercent > 1.f) hpPercent = 1.f;

            int fullWidth = barFillTex.getSize().x;  // 57 пикселей
            int currentWidth = static_cast<int>(fullWidth * hpPercent);

            sf::Sprite barFill(barFillTex);
            barFill.setTextureRect(sf::IntRect(0, 0, currentWidth, barFillTex.getSize().y));
            barFill.setPosition(barX, barY);
            barFill.setScale(barScale, barScale);
            window.draw(barFill);
        }
    }
}
