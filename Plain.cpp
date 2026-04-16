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
}
