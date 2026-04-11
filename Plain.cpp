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

    // Коллизии для поляны (границы мира 1024x1024)
    float wallThickness = 45;
    obstacles.clear();

    sf::RectangleShape top(sf::Vector2f(1024, wallThickness)); top.setPosition(0, 0); top.setFillColor(sf::Color::Transparent); obstacles.push_back(top);
    sf::RectangleShape bottom(sf::Vector2f(1024, wallThickness)); bottom.setPosition(0, 1024 - wallThickness); bottom.setFillColor(sf::Color::Transparent); obstacles.push_back(bottom);
    sf::RectangleShape left(sf::Vector2f(wallThickness, 1024)); left.setPosition(0, 0); left.setFillColor(sf::Color::Transparent); obstacles.push_back(left);
    sf::RectangleShape right(sf::Vector2f(wallThickness, 1024)); right.setPosition(1024 - wallThickness, 0); right.setFillColor(sf::Color::Transparent); obstacles.push_back(right);

    // === СПАВНИМ ВРАГОВ (6-7 штук) ===
    enemyManager.spawnRandomEnemies(7);
    std::cout << "Spawned " << 7 << " enemies on Plain!" << std::endl;

    return true;
}

void PlainLocation::draw(sf::RenderWindow& window) {
    window.draw(mapSprite);

    // Рисуем всех врагов
    enemyManager.drawAll(window);
}
